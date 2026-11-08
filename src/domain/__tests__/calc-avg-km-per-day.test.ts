import {
  calcAvgKmPerDay,
  InvalidDateError,
  InvalidOdometerError,
  OdometerDecreasedError,
} from '@/domain';
import type { OdometerReadingSnapshot } from '@/domain';

const now = '2026-04-01T00:00:00.000Z';

function reading(km: number, readAt: string): OdometerReadingSnapshot {
  return { km, readAt };
}

describe('calcAvgKmPerDay', () => {
  it('retorna zero sem leituras', () => {
    expect(calcAvgKmPerDay([], now)).toBe(0);
  });

  it('retorna zero com apenas uma leitura', () => {
    expect(calcAvgKmPerDay([reading(1_000, '2026-03-31T12:00:00.000Z')], now)).toBe(0);
  });

  it('retorna zero com duas leituras no mesmo dia', () => {
    expect(
      calcAvgKmPerDay(
        [reading(1_000, '2026-03-31T08:00:00.000Z'), reading(1_100, '2026-03-31T18:00:00.000Z')],
        now,
      ),
    ).toBe(0);
  });

  it('retorna zero com o mesmo km em dias diferentes', () => {
    expect(
      calcAvgKmPerDay(
        [reading(1_000, '2026-03-30T12:00:00.000Z'), reading(1_000, '2026-04-01T00:00:00.000Z')],
        now,
      ),
    ).toBe(0);
  });

  it('calcula a média de duas leituras crescentes em um dia', () => {
    expect(
      calcAvgKmPerDay(
        [reading(1_000, '2026-03-31T12:00:00.000Z'), reading(1_100, '2026-04-01T00:00:00.000Z')],
        now,
      ),
    ).toBe(100);
  });

  it('ordena leituras fora de ordem', () => {
    expect(
      calcAvgKmPerDay(
        [
          reading(1_100, '2026-04-01T00:00:00.000Z'),
          reading(900, '2026-03-30T12:00:00.000Z'),
          reading(1_000, '2026-03-31T12:00:00.000Z'),
        ],
        now,
      ),
    ).toBe(100);
  });

  it('rejeita leituras com km diminuindo', () => {
    expect(() =>
      calcAvgKmPerDay(
        [reading(1_000, '2026-03-30T12:00:00.000Z'), reading(900, '2026-03-31T12:00:00.000Z')],
        now,
      ),
    ).toThrow(OdometerDecreasedError);
  });

  it('usa a janela dos últimos 90 dias', () => {
    expect(
      calcAvgKmPerDay(
        [
          reading(0, '2025-12-31T12:00:00.000Z'),
          reading(1_000, '2026-03-01T12:00:00.000Z'),
          reading(2_000, '2026-04-01T00:00:00.000Z'),
        ],
        now,
      ),
    ).toBeCloseTo(1_000 / 31);
  });

  it('inclui leitura no limite exato de 90 dias', () => {
    expect(
      calcAvgKmPerDay(
        [reading(0, '2026-01-01T00:00:00.000Z'), reading(900, '2026-04-01T00:00:00.000Z')],
        now,
      ),
    ).toBe(10);
  });

  it('exclui leitura com 91 dias', () => {
    expect(
      calcAvgKmPerDay(
        [
          reading(0, '2025-12-31T00:00:00.000Z'),
          reading(500, '2026-03-01T12:00:00.000Z'),
          reading(1_000, '2026-04-01T00:00:00.000Z'),
        ],
        now,
      ),
    ).toBeCloseTo(500 / 31);
  });

  it('faz fallback para todas as leituras quando há menos de duas na janela', () => {
    expect(
      calcAvgKmPerDay(
        [reading(0, '2025-12-01T00:00:00.000Z'), reading(100, '2025-12-31T00:00:00.000Z')],
        now,
      ),
    ).toBeCloseTo(100 / 30);
  });

  it('faz fallback quando nenhuma leitura está na janela', () => {
    expect(
      calcAvgKmPerDay(
        [reading(0, '2025-12-01T00:00:00.000Z'), reading(100, '2025-12-31T00:00:00.000Z')],
        now,
      ),
    ).toBeCloseTo(100 / 30);
  });

  it('faz fallback quando apenas uma leitura está na janela', () => {
    expect(
      calcAvgKmPerDay(
        [reading(0, '2025-12-31T00:00:00.000Z'), reading(100, '2026-04-01T00:00:00.000Z')],
        now,
      ),
    ).toBeCloseTo(100 / 91);
  });

  it('ignora leituras futuras', () => {
    expect(
      calcAvgKmPerDay(
        [
          reading(1_000, '2026-03-31T12:00:00.000Z'),
          reading(1_100, '2026-04-01T00:00:00.000Z'),
          reading(5_000, '2026-04-02T00:00:00.000Z'),
        ],
        now,
      ),
    ).toBe(100);
  });

  it('calcula média atravessando a virada de ano', () => {
    expect(
      calcAvgKmPerDay(
        [reading(1_000, '2025-12-31T12:00:00.000Z'), reading(1_100, '2026-01-01T12:00:00.000Z')],
        '2026-01-02T00:00:00.000Z',
      ),
    ).toBe(100);
  });

  it('rejeita queda de odômetro fora da janela', () => {
    expect(() =>
      calcAvgKmPerDay(
        [
          reading(1_000, '2025-12-01T00:00:00.000Z'),
          reading(900, '2025-12-31T00:00:00.000Z'),
          reading(2_000, '2026-04-01T00:00:00.000Z'),
        ],
        now,
      ),
    ).toThrow(OdometerDecreasedError);
  });

  it('retorna zero para leituras no mesmo timestamp com km diferente', () => {
    expect(
      calcAvgKmPerDay(
        [reading(1_000, '2026-04-01T00:00:00.000Z'), reading(1_100, '2026-04-01T00:00:00.000Z')],
        now,
      ),
    ).toBe(0);
  });

  it('usa a leitura mais recente como referência quando now é omitido', () => {
    expect(
      calcAvgKmPerDay([
        reading(1_000, '2026-03-31T12:00:00.000Z'),
        reading(1_100, '2026-04-01T12:00:00.000Z'),
      ]),
    ).toBe(100);
  });

  it('rejeita data inválida em leitura', () => {
    expect(() => calcAvgKmPerDay([reading(1_000, 'data-invalida')], now)).toThrow(InvalidDateError);
  });

  it('rejeita now inválido', () => {
    expect(() => calcAvgKmPerDay([], 'data-invalida')).toThrow(InvalidDateError);
  });

  it('rejeita km negativo ou não finito', () => {
    expect(() => calcAvgKmPerDay([reading(-1, '2026-03-31T12:00:00.000Z')], now)).toThrow(
      InvalidOdometerError,
    );
    expect(() =>
      calcAvgKmPerDay([reading(Number.POSITIVE_INFINITY, '2026-03-31T12:00:00.000Z')], now),
    ).toThrow(InvalidOdometerError);
  });
});
