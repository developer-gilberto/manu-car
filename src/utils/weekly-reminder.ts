import type { WeeklyReminderSchedule } from '@/domain';

export interface WeekdayOption {
  value: number;
  short: string;
  long: string;
}

export const WEEKDAYS: readonly WeekdayOption[] = [
  { value: 1, short: 'Dom', long: 'Domingo' },
  { value: 2, short: 'Seg', long: 'Segunda-feira' },
  { value: 3, short: 'Ter', long: 'Terça-feira' },
  { value: 4, short: 'Qua', long: 'Quarta-feira' },
  { value: 5, short: 'Qui', long: 'Quinta-feira' },
  { value: 6, short: 'Sex', long: 'Sexta-feira' },
  { value: 7, short: 'Sáb', long: 'Sábado' },
];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatWeeklyReminder(schedule: WeeklyReminderSchedule): string {
  const weekday = WEEKDAYS.find((option) => option.value === schedule.weekday)?.long ?? 'Domingo';

  return `${weekday} às ${pad2(schedule.hour)}:${pad2(schedule.minute)}`;
}
