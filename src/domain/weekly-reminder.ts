export interface WeeklyReminderSchedule {
  /** 1 = domingo, 2 = segunda, ..., 7 = sábado (convenção do expo-notifications). */
  weekday: number;
  hour: number;
  minute: number;
}

export const DEFAULT_WEEKLY_REMINDER: WeeklyReminderSchedule = {
  weekday: 2,
  hour: 9,
  minute: 0,
};

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function isValidWeeklyReminderSchedule(value: unknown): value is WeeklyReminderSchedule {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isIntegerInRange(record.weekday, 1, 7) &&
    isIntegerInRange(record.hour, 0, 23) &&
    isIntegerInRange(record.minute, 0, 59)
  );
}

/**
 * Aceita apenas valores válidos; qualquer dado ausente ou corrompido volta ao
 * padrão (segunda-feira às 09:00) para não impedir o agendamento.
 */
export function normalizeWeeklyReminderSchedule(value: unknown): WeeklyReminderSchedule {
  if (!isValidWeeklyReminderSchedule(value)) {
    return DEFAULT_WEEKLY_REMINDER;
  }

  return {
    weekday: value.weekday,
    hour: value.hour,
    minute: value.minute,
  };
}
