import { differenceInUtcCalendarDays, parseIsoDate } from './date-utils';
import { OdometerDecreasedError } from './errors';
import type { OdometerReadingSnapshot } from './types';
import { assertValidOdometerKm } from './validation';

const WINDOW_DAYS = 90;

interface DatedReading {
  km: number;
  date: Date;
}

interface TaggedDatedReading extends DatedReading {
  candidate: boolean;
}

function compareDatedReadings(first: DatedReading, second: DatedReading): number {
  const byDate = first.date.getTime() - second.date.getTime();

  return byDate !== 0 ? byDate : first.km - second.km;
}

function parseReadings(readings: readonly OdometerReadingSnapshot[]): DatedReading[] {
  return readings.map((reading): DatedReading => {
    assertValidOdometerKm(reading.km, 'reading.km');

    return {
      km: reading.km,
      date: parseIsoDate(reading.readAt),
    };
  });
}

function prepareReadings(
  readings: readonly OdometerReadingSnapshot[],
  nowDate: Date | undefined,
): DatedReading[] {
  return parseReadings(readings)
    .filter((reading) => nowDate === undefined || reading.date.getTime() <= nowDate.getTime())
    .sort(compareDatedReadings);
}

function assertNonDecreasing(sortedReadings: readonly DatedReading[]): void {
  for (let index = 1; index < sortedReadings.length; index += 1) {
    const previous = sortedReadings[index - 1];
    const current = sortedReadings[index];

    if (previous && current && current.km < previous.km) {
      throw new OdometerDecreasedError(previous.km, current.km);
    }
  }
}

/**
 * Valida apenas a vizinhança cronológica da leitura candidata. Assim, um
 * histórico antigo já inconsistente não impede o registro de novas leituras.
 */
export function assertOdometerReadingFits(
  readings: readonly OdometerReadingSnapshot[],
  candidate: OdometerReadingSnapshot,
): void {
  const [candidateReading] = parseReadings([candidate]);

  if (!candidateReading) {
    return;
  }

  const sorted = [
    ...parseReadings(readings).map((reading): TaggedDatedReading => ({
      ...reading,
      candidate: false,
    })),
    { ...candidateReading, candidate: true },
  ].sort(compareDatedReadings);
  const index = sorted.findIndex((reading) => reading.candidate);
  const previous = index > 0 ? sorted[index - 1] : undefined;
  const next = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined;

  if (previous && candidateReading.km < previous.km) {
    throw new OdometerDecreasedError(previous.km, candidateReading.km);
  }

  if (next && candidateReading.km > next.km) {
    throw new OdometerDecreasedError(candidateReading.km, next.km);
  }
}

export function calcAvgKmPerDay(
  readings: readonly OdometerReadingSnapshot[],
  now?: string,
): number {
  const nowDate = now === undefined ? undefined : parseIsoDate(now);
  const pastReadings = prepareReadings(readings, nowDate);
  assertNonDecreasing(pastReadings);

  const latestReading = pastReadings[pastReadings.length - 1];
  const referenceDate = nowDate ?? latestReading?.date;

  if (!referenceDate) {
    return 0;
  }

  const windowReadings = pastReadings.filter(
    (reading) => differenceInUtcCalendarDays(referenceDate, reading.date) <= WINDOW_DAYS,
  );
  const selected = windowReadings.length >= 2 ? windowReadings : pastReadings;

  if (selected.length < 2) {
    return 0;
  }

  const first = selected[0];
  const last = selected[selected.length - 1];

  if (!first || !last) {
    return 0;
  }

  const days = differenceInUtcCalendarDays(last.date, first.date);

  if (days <= 0) {
    return 0;
  }

  return (last.km - first.km) / days;
}
