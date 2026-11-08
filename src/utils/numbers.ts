const INTEGER_PATTERN = /^\d+$/;

export function parseNonNegativeInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!INTEGER_PATTERN.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function parsePositiveInteger(value: string): number | null {
  const parsed = parseNonNegativeInteger(value);

  if (parsed === null || parsed <= 0) {
    return null;
  }

  return parsed;
}
