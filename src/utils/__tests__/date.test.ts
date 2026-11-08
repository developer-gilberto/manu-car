import {
  differenceInUtcCalendarDays,
  formatDate,
  formatDateInput,
  formatKm,
  isFutureDateInput,
  parseDateInput,
  todayDateInput,
} from '@/utils/date';

describe('date utils', () => {
  it('parses valid pt-BR dates as UTC noon', () => {
    expect(parseDateInput('08/11/2026')).toBe('2026-11-08T12:00:00.000Z');
    expect(parseDateInput('29/02/2024')).toBe('2024-02-29T12:00:00.000Z');
  });

  it('rejects invalid pt-BR dates', () => {
    expect(parseDateInput('31/02/2026')).toBeNull();
    expect(parseDateInput('2026-11-08')).toBeNull();
    expect(parseDateInput('')).toBeNull();
  });

  it('formats ISO dates to pt-BR', () => {
    expect(formatDateInput('2026-11-08T12:00:00.000Z')).toBe('08/11/2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('invalid')).toBe('—');
  });

  it('builds today input', () => {
    expect(todayDateInput()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('detects future dates', () => {
    expect(isFutureDateInput('01/01/2099')).toBe(true);
    expect(isFutureDateInput('01/01/2000')).toBe(false);
    expect(isFutureDateInput('invalid')).toBe(false);
  });

  it('calculates UTC calendar day differences', () => {
    expect(
      differenceInUtcCalendarDays('2026-11-08T23:59:59.000Z', '2026-11-01T00:00:00.000Z'),
    ).toBe(7);
    expect(
      differenceInUtcCalendarDays('2026-11-01T00:00:00.000Z', '2026-11-08T23:59:59.000Z'),
    ).toBe(-7);
  });

  it('formats kilometers in pt-BR', () => {
    expect(formatKm(12345)).toBe('12.345 km');
  });
});
