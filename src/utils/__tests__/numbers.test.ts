import { parseNonNegativeInteger, parsePositiveInteger } from '@/utils/numbers';

describe('number utils', () => {
  it('parses non-negative integers', () => {
    expect(parseNonNegativeInteger('0')).toBe(0);
    expect(parseNonNegativeInteger('12345')).toBe(12345);
    expect(parseNonNegativeInteger(' 42 ')).toBe(42);
  });

  it('rejects invalid non-negative integers', () => {
    expect(parseNonNegativeInteger('')).toBeNull();
    expect(parseNonNegativeInteger('-1')).toBeNull();
    expect(parseNonNegativeInteger('1.5')).toBeNull();
    expect(parseNonNegativeInteger('abc')).toBeNull();
  });

  it('parses positive integers', () => {
    expect(parsePositiveInteger('1')).toBe(1);
    expect(parsePositiveInteger('0')).toBeNull();
    expect(parsePositiveInteger('abc')).toBeNull();
  });
});
