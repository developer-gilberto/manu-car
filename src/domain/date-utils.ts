import { InvalidDateError } from './errors';

const MS_PER_DAY = 86_400_000;

export function parseIsoDate(value: string): Date {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidDateError(value);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new InvalidDateError(value);
  }

  return date;
}

export function addMonthsUtc(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const target = new Date(
    Date.UTC(
      year,
      month + months,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return target;
}

export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

export function utcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / MS_PER_DAY,
  );
}

export function differenceInUtcCalendarDays(later: Date, earlier: Date): number {
  return utcDayNumber(later) - utcDayNumber(earlier);
}
