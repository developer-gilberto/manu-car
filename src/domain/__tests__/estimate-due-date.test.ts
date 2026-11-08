import {
  estimateDueDate,
  InvalidDateError,
  InvalidIntervalError,
  OdometerDecreasedError,
} from '@/domain';
import type { MaintenanceItemSnapshot, VehicleSnapshot } from '@/domain';

const vehicle: VehicleSnapshot = {
  odometerKm: 50_000,
  odometerUpdatedAt: '2026-01-31T12:00:00.000Z',
};

function makeItem(overrides: Partial<MaintenanceItemSnapshot> = {}): MaintenanceItemSnapshot {
  return {
    intervalKm: 10_000,
    intervalMonths: null,
    lastDoneKm: 45_000,
    lastDoneAt: null,
    ...overrides,
  };
}

describe('estimateDueDate', () => {
  it('retorna null quando não há intervalo de km', () => {
    expect(estimateDueDate(makeItem({ intervalKm: null }), vehicle, 100)).toBeNull();
  });

  it('retorna null quando a média é zero', () => {
    expect(estimateDueDate(makeItem(), vehicle, 0)).toBeNull();
  });

  it('retorna null quando a média é negativa', () => {
    expect(estimateDueDate(makeItem(), vehicle, -5)).toBeNull();
  });

  it('retorna null quando a média não é finita', () => {
    expect(estimateDueDate(makeItem(), vehicle, Number.NaN)).toBeNull();
    expect(estimateDueDate(makeItem(), vehicle, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('estima a data somando os dias restantes', () => {
    expect(estimateDueDate(makeItem(), vehicle, 100)).toBe('2026-03-22T12:00:00.000Z');
  });

  it('retorna a data do odômetro quando faltam zero km', () => {
    expect(
      estimateDueDate(makeItem({ lastDoneKm: 50_000 }), { ...vehicle, odometerKm: 60_000 }, 100),
    ).toBe(vehicle.odometerUpdatedAt);
  });

  it('estima data no passado quando o item já venceu', () => {
    expect(
      estimateDueDate(makeItem({ lastDoneKm: 45_000 }), { ...vehicle, odometerKm: 60_000 }, 100),
    ).toBe('2025-12-12T12:00:00.000Z');
  });

  it('arredonda dias fracionários positivos para cima', () => {
    expect(estimateDueDate(makeItem({ lastDoneKm: 41_000 }), vehicle, 333)).toBe(
      '2026-02-04T12:00:00.000Z',
    );
  });

  it('arredonda dias fracionários negativos para baixo', () => {
    expect(estimateDueDate(makeItem({ lastDoneKm: 39_950 }), vehicle, 100)).toBe(
      '2026-01-30T12:00:00.000Z',
    );
  });

  it('vira o mês ao somar dias', () => {
    expect(estimateDueDate(makeItem({ intervalKm: 1, lastDoneKm: 50_000 }), vehicle, 1)).toBe(
      '2026-02-01T12:00:00.000Z',
    );
  });

  it('vira o ano ao somar dias', () => {
    expect(
      estimateDueDate(
        makeItem({ intervalKm: 1, lastDoneKm: 50_000 }),
        { ...vehicle, odometerUpdatedAt: '2025-12-31T12:00:00.000Z' },
        1,
      ),
    ).toBe('2026-01-01T12:00:00.000Z');
  });

  it('trata ano bissexto ao somar dias', () => {
    expect(
      estimateDueDate(
        makeItem({ intervalKm: 1, lastDoneKm: 50_000 }),
        { ...vehicle, odometerUpdatedAt: '2024-02-28T12:00:00.000Z' },
        1,
      ),
    ).toBe('2024-02-29T12:00:00.000Z');

    expect(
      estimateDueDate(
        makeItem({ intervalKm: 1, lastDoneKm: 50_000 }),
        { ...vehicle, odometerUpdatedAt: '2024-02-29T12:00:00.000Z' },
        1,
      ),
    ).toBe('2024-03-01T12:00:00.000Z');
  });

  it('preserva o horário UTC ao somar dias', () => {
    expect(
      estimateDueDate(
        makeItem({ intervalKm: 1, lastDoneKm: 50_000 }),
        { ...vehicle, odometerUpdatedAt: '2026-01-31T23:45:30.123Z' },
        1,
      ),
    ).toBe('2026-02-01T23:45:30.123Z');
  });

  it('usa o baseline atual quando o item nunca foi feito', () => {
    expect(
      estimateDueDate(
        makeItem({ lastDoneKm: null, lastDoneAt: null }),
        { ...vehicle, odometerUpdatedAt: '2026-01-15T12:00:00.000Z' },
        100,
      ),
    ).toBe('2026-04-25T12:00:00.000Z');
  });

  it('rejeita odômetro que diminuiu', () => {
    expect(() => estimateDueDate(makeItem({ lastDoneKm: 60_000 }), vehicle, 100)).toThrow(
      OdometerDecreasedError,
    );
  });

  it('rejeita data inválida do veículo', () => {
    expect(() =>
      estimateDueDate(makeItem(), { ...vehicle, odometerUpdatedAt: 'data-invalida' }, 100),
    ).toThrow(InvalidDateError);
  });

  it('rejeita intervalo de km inválido', () => {
    expect(() => estimateDueDate(makeItem({ intervalKm: 0 }), vehicle, 100)).toThrow(
      InvalidIntervalError,
    );
  });
});
