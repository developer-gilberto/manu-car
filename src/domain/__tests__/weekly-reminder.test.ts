import {
  DEFAULT_WEEKLY_REMINDER,
  isValidWeeklyReminderSchedule,
  normalizeWeeklyReminderSchedule,
} from '../weekly-reminder';

describe('weekly reminder schedule', () => {
  it('usa segunda-feira às 09:00 como padrão', () => {
    expect(DEFAULT_WEEKLY_REMINDER).toEqual({ weekday: 2, hour: 9, minute: 0 });
    expect(normalizeWeeklyReminderSchedule(null)).toEqual(DEFAULT_WEEKLY_REMINDER);
  });

  it.each([
    { weekday: 1, hour: 0, minute: 0 },
    { weekday: 7, hour: 23, minute: 59 },
    { weekday: 4, hour: 18, minute: 30 },
  ])('aceita um horário válido: %j', (schedule) => {
    expect(isValidWeeklyReminderSchedule(schedule)).toBe(true);
    expect(normalizeWeeklyReminderSchedule(schedule)).toEqual(schedule);
  });

  it.each([
    null,
    undefined,
    'segunda',
    42,
    [],
    { weekday: 0, hour: 9, minute: 0 },
    { weekday: 8, hour: 9, minute: 0 },
    { weekday: 2, hour: -1, minute: 0 },
    { weekday: 2, hour: 24, minute: 0 },
    { weekday: 2, hour: 9, minute: -1 },
    { weekday: 2, hour: 9, minute: 60 },
    { weekday: 2.5, hour: 9, minute: 0 },
    { weekday: '2', hour: 9, minute: 0 },
    { weekday: 2, hour: '9', minute: 0 },
  ])('volta ao padrão para um horário inválido: %j', (schedule) => {
    expect(isValidWeeklyReminderSchedule(schedule)).toBe(false);
    expect(normalizeWeeklyReminderSchedule(schedule)).toEqual(DEFAULT_WEEKLY_REMINDER);
  });

  it('copia o objeto para não expor a referência original', () => {
    const schedule = { weekday: 6, hour: 18, minute: 45 };
    const normalized = normalizeWeeklyReminderSchedule(schedule);

    expect(normalized).toEqual(schedule);
    expect(normalized).not.toBe(schedule);
  });
});
