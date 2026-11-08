import { differenceInUtcCalendarDays, parseIsoDate } from './date-utils';
import { OdometerDecreasedError } from './errors';
import type { OdometerReadingSnapshot } from './types';
import { assertValidOdometerKm } from './validation';

const WINDOW_DAYS = 90;

interface DatedReading {
  km: number;
  date: Date;
}

export function calcAvgKmPerDay(
  readings: readonly OdometerReadingSnapshot[],
  now?: string,
): number {
  const nowDate = now === undefined ? undefined : parseIsoDate(now);
  const pastReadings = readings
    .map((reading): DatedReading => {
      assertValidOdometerKm(reading.km, 'reading.km');

      return {
        km: reading.km,
        date: parseIsoDate(reading.readAt),
      };
    })
    .filter((reading) => nowDate === undefined || reading.date.getTime() <= nowDate.getTime())
    .sort((first, second) => {
      const byDate = first.date.getTime() - second.date.getTime();

      return byDate !== 0 ? byDate : first.km - second.km;
    });

  for (let index = 1; index < pastReadings.length; index += 1) {
    const previous = pastReadings[index - 1];
    const current = pastReadings[index];

    if (previous && current && current.km < previous.km) {
      throw new OdometerDecreasedError(previous.km, current.km);
    }
  }

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
