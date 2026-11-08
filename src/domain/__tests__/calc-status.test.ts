import { calcStatus, OdometerDecreasedError } from '@/domain';
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

describe('calcStatus', () => {
  it('retorna ok quando o item não tem intervalos', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: null }),
        vehicle,
        '2026-01-15T12:00:00.000Z',
      ),
    ).toBe('ok');
  });

  it.each([
    { odometerKm: 45_000, expected: 'ok' },
    { odometerKm: 52_900, expected: 'ok' },
    { odometerKm: 53_000, expected: 'atencao' },
    { odometerKm: 54_900, expected: 'atencao' },
    { odometerKm: 55_000, expected: 'vencido' },
    { odometerKm: 55_001, expected: 'vencido' },
  ] as const)('classifica por km com odômetro em $odometerKm', ({ odometerKm, expected }) => {
    expect(
      calcStatus(
        makeItem({ intervalMonths: null, lastDoneAt: null }),
        { ...vehicle, odometerKm },
        '2026-01-15T12:00:00.000Z',
      ),
    ).toBe(expected);
  });

  it('classifica por data antes de 80%', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: 1, lastDoneAt: '2026-01-15T12:00:00.000Z' }),
        vehicle,
        '2026-02-08T12:00:00.000Z',
      ),
    ).toBe('ok');
  });

  it('classifica por data exatamente em 80%', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: 3, lastDoneAt: '2026-01-15T12:00:00.000Z' }),
        vehicle,
        '2026-03-28T12:00:00.000Z',
      ),
    ).toBe('atencao');
  });

  it('classifica por data um dia antes de 80% como ok', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: 3, lastDoneAt: '2026-01-15T12:00:00.000Z' }),
        vehicle,
        '2026-03-27T12:00:00.000Z',
      ),
    ).toBe('ok');
  });

  it('classifica por data na véspera do vencimento como atencao', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: 1, lastDoneAt: '2026-01-15T12:00:00.000Z' }),
        vehicle,
        '2026-02-14T23:59:59.000Z',
      ),
    ).toBe('atencao');
  });

  it('classifica por data no dia do vencimento como vencido em qualquer horário', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: 1, lastDoneAt: '2026-01-15T12:00:00.000Z' }),
        vehicle,
        '2026-02-15T00:00:00.000Z',
      ),
    ).toBe('vencido');
  });

  it('classifica por data depois do vencimento como vencido', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: null, intervalMonths: 1, lastDoneAt: '2026-01-15T12:00:00.000Z' }),
        vehicle,
        '2026-02-16T12:00:00.000Z',
      ),
    ).toBe('vencido');
  });

  it('usa o pior status entre km e data', () => {
    const item = makeItem({
      intervalKm: 10_000,
      intervalMonths: 1,
      lastDoneKm: 45_000,
      lastDoneAt: '2026-01-15T12:00:00.000Z',
    });

    expect(calcStatus(item, { ...vehicle, odometerKm: 50_000 }, '2026-02-09T12:00:00.000Z')).toBe(
      'atencao',
    );
    expect(calcStatus(item, { ...vehicle, odometerKm: 55_000 }, '2026-02-09T12:00:00.000Z')).toBe(
      'vencido',
    );
    expect(calcStatus(item, { ...vehicle, odometerKm: 50_000 }, '2026-01-20T12:00:00.000Z')).toBe(
      'ok',
    );
  });

  it('mantém ok quando o item nunca foi feito e o baseline é atual', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: 10_000, intervalMonths: 12, lastDoneKm: null, lastDoneAt: null }),
        vehicle,
        '2026-01-15T12:00:00.000Z',
      ),
    ).toBe('ok');
  });

  it('fica vencido por tempo quando o item nunca foi feito e a data do veículo é antiga', () => {
    expect(
      calcStatus(
        makeItem({ intervalKm: 10_000, intervalMonths: 12, lastDoneKm: null, lastDoneAt: null }),
        { ...vehicle, odometerUpdatedAt: '2024-01-15T12:00:00.000Z' },
        '2026-01-15T12:00:00.000Z',
      ),
    ).toBe('vencido');
  });

  it('retorna ok quando lastDoneAt está no futuro', () => {
    expect(
      calcStatus(
        makeItem({
          intervalKm: null,
          intervalMonths: 1,
          lastDoneAt: '2026-03-01T12:00:00.000Z',
        }),
        vehicle,
        '2026-01-01T12:00:00.000Z',
      ),
    ).toBe('ok');
  });

  it('calcula 80% na virada de ano', () => {
    const item = makeItem({
      intervalKm: null,
      intervalMonths: 1,
      lastDoneAt: '2025-12-31T12:00:00.000Z',
    });

    expect(calcStatus(item, vehicle, '2026-01-30T12:00:00.000Z')).toBe('atencao');
    expect(calcStatus(item, vehicle, '2026-01-31T00:00:00.000Z')).toBe('vencido');
  });

  it('propaga erro de odômetro diminuído', () => {
    expect(() =>
      calcStatus(makeItem({ lastDoneKm: 60_000 }), vehicle, '2026-01-15T12:00:00.000Z'),
    ).toThrow(OdometerDecreasedError);
  });
});
