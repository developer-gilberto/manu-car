import { InvalidIntervalError, InvalidOdometerError } from './errors';

export function assertValidOdometerKm(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new InvalidOdometerError(value, field);
  }
}

export function assertValidInterval(value: number | null, field: string): void {
  if (value !== null && (!Number.isFinite(value) || value <= 0)) {
    throw new InvalidIntervalError(value, field);
  }
}
