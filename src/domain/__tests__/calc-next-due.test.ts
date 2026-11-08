import {
  calcNextDue,
  InvalidDateError,
  InvalidIntervalError,
  InvalidOdometerError,
  OdometerDecreasedError,
} from '@/domain';
import type { MaintenanceItemSnapshot, VehicleSnapshot } from '@/domain';

const vehicle: VehicleSnapshot = {
  odometerKm: 50_000,
  odometerUpdatedAt: '2026-01-15T12:00:00.000Z',
};

function makeItem(overrides: Partial<MaintenanceItemSnapshot> = {}): MaintenanceItemSnapshot {
  return {
    intervalKm: 10_000,
    intervalMonths: 12,
    lastDoneKm: 45_000,
    lastDoneAt: '2025-12-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('calcNextDue', () => {
  it('calcula vencimento por km e por data quando ambos existem', () => {
    expect(calcNextDue(makeItem(), vehicle)).toEqual({
      dueKm: 55_000,
      dueAt: '2026-12-15T12:00:00.000Z',
    });
  });

  it('calcula apenas o vencimento por km', () => {
    expect(calcNextDue(makeItem({ intervalMonths: null }), vehicle)).toEqual({
      dueKm: 55_000,
      dueAt: null,
    });
  });

  it('calcula apenas o vencimento por data', () => {
    expect(calcNextDue(makeItem({ intervalKm: null }), vehicle)).toEqual({
      dueKm: null,
      dueAt: '2026-12-15T12:00:00.000Z',
    });
  });

  it('retorna ambos nulos quando o item não tem intervalos', () => {
    expect(calcNextDue(makeItem({ intervalKm: null, intervalMonths: null }), vehicle)).toEqual({
      dueKm: null,
      dueAt: null,
    });
  });

  it('usa o odômetro e a data atuais do veículo quando o item nunca foi feito', () => {
    expect(calcNextDue(makeItem({ lastDoneKm: null, lastDoneAt: null }), vehicle)).toEqual({
      dueKm: 60_000,
      dueAt: '2027-01-15T12:00:00.000Z',
    });
  });

  it('usa a data do veículo quando lastDoneAt é nulo', () => {
    expect(calcNextDue(makeItem({ lastDoneKm: 45_000, lastDoneAt: null }), vehicle)).toEqual({
      dueKm: 55_000,
      dueAt: '2027-01-15T12:00:00.000Z',
    });
  });

  it('usa o odômetro atual quando lastDoneKm é nulo', () => {
    expect(
      calcNextDue(makeItem({ lastDoneKm: null, lastDoneAt: '2025-12-15T12:00:00.000Z' }), vehicle),
    ).toEqual({
      dueKm: 60_000,
      dueAt: '2026-12-15T12:00:00.000Z',
    });
  });

  it('aceita lastDoneKm igual a zero', () => {
    expect(calcNextDue(makeItem({ lastDoneKm: 0 }), vehicle).dueKm).toBe(10_000);
  });

  it('calcula vencimento exatamente no odômetro atual', () => {
    expect(
      calcNextDue(makeItem({ lastDoneKm: 45_000, intervalKm: 5_000 }), {
        ...vehicle,
        odometerKm: 50_000,
      }).dueKm,
    ).toBe(50_000);
  });

  it('soma meses virando o mês', () => {
    expect(
      calcNextDue(makeItem({ intervalMonths: 1, lastDoneAt: '2026-01-15T12:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2026-02-15T12:00:00.000Z');
  });

  it('faz clamp no último dia do mês', () => {
    expect(
      calcNextDue(makeItem({ intervalMonths: 1, lastDoneAt: '2026-01-31T12:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2026-02-28T12:00:00.000Z');

    expect(
      calcNextDue(makeItem({ intervalMonths: 1, lastDoneAt: '2024-01-31T12:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2024-02-29T12:00:00.000Z');
  });

  it('soma meses virando o ano', () => {
    expect(
      calcNextDue(makeItem({ intervalMonths: 1, lastDoneAt: '2025-12-15T12:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2026-01-15T12:00:00.000Z');

    expect(
      calcNextDue(makeItem({ intervalMonths: 2, lastDoneAt: '2025-12-31T12:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2026-02-28T12:00:00.000Z');
  });

  it('trata ano bissexto ao somar meses', () => {
    expect(
      calcNextDue(makeItem({ intervalMonths: 12, lastDoneAt: '2024-02-29T12:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2025-02-28T12:00:00.000Z');
  });

  it('preserva o horário UTC ao somar meses', () => {
    expect(
      calcNextDue(makeItem({ intervalMonths: 1, lastDoneAt: '2026-01-31T23:45:30.123Z' }), vehicle)
        .dueAt,
    ).toBe('2026-02-28T23:45:30.123Z');
  });

  it('aceita lastDoneAt futuro sem lançar erro', () => {
    expect(
      calcNextDue(makeItem({ intervalMonths: 12, lastDoneAt: '2026-06-01T00:00:00.000Z' }), vehicle)
        .dueAt,
    ).toBe('2027-06-01T00:00:00.000Z');
  });

  it('rejeita data inválida', () => {
    expect(() =>
      calcNextDue(makeItem({ intervalMonths: 12, lastDoneAt: 'data-invalida' }), vehicle),
    ).toThrow(InvalidDateError);
  });

  it('rejeita data inválida do veículo quando precisa dela', () => {
    expect(() =>
      calcNextDue(makeItem({ lastDoneAt: null }), {
        ...vehicle,
        odometerUpdatedAt: 'data-invalida',
      }),
    ).toThrow(InvalidDateError);
  });

  it('rejeita odômetro negativo ou não finito', () => {
    expect(() => calcNextDue(makeItem(), { ...vehicle, odometerKm: -1 })).toThrow(
      InvalidOdometerError,
    );
    expect(() => calcNextDue(makeItem(), { ...vehicle, odometerKm: Number.NaN })).toThrow(
      InvalidOdometerError,
    );
  });

  it('rejeita lastDoneKm negativo', () => {
    expect(() => calcNextDue(makeItem({ lastDoneKm: -1 }), vehicle)).toThrow(InvalidOdometerError);
  });

  it('rejeita intervalos zero ou negativos', () => {
    expect(() => calcNextDue(makeItem({ intervalKm: 0 }), vehicle)).toThrow(InvalidIntervalError);
    expect(() => calcNextDue(makeItem({ intervalMonths: -1 }), vehicle)).toThrow(
      InvalidIntervalError,
    );
  });

  it('rejeita odômetro que diminuiu com erro tipado', () => {
    expect(() => calcNextDue(makeItem({ lastDoneKm: 60_000 }), vehicle)).toThrow(
      OdometerDecreasedError,
    );

    try {
      calcNextDue(makeItem({ lastDoneKm: 60_000 }), vehicle);
    } catch (error) {
      expect(error).toBeInstanceOf(OdometerDecreasedError);
      if (error instanceof OdometerDecreasedError) {
        expect(error.code).toBe('ODOMETER_DECREASED');
        expect(error.previousKm).toBe(60_000);
        expect(error.currentKm).toBe(50_000);
      }
    }
  });
});
