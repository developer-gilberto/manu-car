import { formatCents, parseCurrencyToCents } from '@/utils/currency';

describe('currency utils', () => {
  it('parses pt-BR currency values', () => {
    expect(parseCurrencyToCents('R$ 1.234,56')).toBe(123456);
    expect(parseCurrencyToCents('1234,56')).toBe(123456);
    expect(parseCurrencyToCents('1234.56')).toBe(123456);
    expect(parseCurrencyToCents('1234')).toBe(123400);
    expect(parseCurrencyToCents('1.234')).toBe(123400);
    expect(parseCurrencyToCents('0,00')).toBe(0);
  });

  it('returns null for empty or invalid values', () => {
    expect(parseCurrencyToCents('')).toBeNull();
    expect(parseCurrencyToCents('abc')).toBeNull();
    expect(parseCurrencyToCents('-10')).toBeNull();
    expect(parseCurrencyToCents('12,345')).toBeNull();
  });

  it('formats cents as BRL', () => {
    expect(formatCents(123456).replace(/\u00a0/g, ' ')).toBe('R$ 1.234,56');
    expect(formatCents(null)).toBe('—');
  });
});
