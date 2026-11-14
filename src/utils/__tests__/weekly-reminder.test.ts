import { formatWeeklyReminder, WEEKDAYS } from '../weekly-reminder';

describe('formatWeeklyReminder', () => {
  it('formata o dia e o horário com zero à esquerda', () => {
    expect(formatWeeklyReminder({ weekday: 2, hour: 9, minute: 0 })).toBe('Segunda-feira às 09:00');
    expect(formatWeeklyReminder({ weekday: 6, hour: 18, minute: 5 })).toBe('Sexta-feira às 18:05');
  });

  it('cobre todos os dias da semana na convenção do expo-notifications', () => {
    expect(WEEKDAYS.map((day) => day.value)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(WEEKDAYS[0].long).toBe('Domingo');
    expect(WEEKDAYS[6].long).toBe('Sábado');
  });
});
