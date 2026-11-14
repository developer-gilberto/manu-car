import { resolveBaselineKm } from './baseline';
import { addDaysUtc, parseIsoDate } from './date-utils';
import { OdometerDecreasedError } from './errors';
import type { MaintenanceItemSnapshot, VehicleSnapshot } from './types';
import { assertValidInterval, assertValidOdometerKm } from './validation';

export function estimateDueDate(
  item: MaintenanceItemSnapshot,
  vehicle: VehicleSnapshot,
  avgKmPerDay: number,
): string | null {
  assertValidInterval(item.intervalKm, 'item.intervalKm');

  if (item.intervalKm === null) {
    return null;
  }

  assertValidOdometerKm(vehicle.odometerKm, 'vehicle.odometerKm');

  if (item.lastDoneKm !== null) {
    assertValidOdometerKm(item.lastDoneKm, 'item.lastDoneKm');
  }

  if (item.baselineKm !== null) {
    assertValidOdometerKm(item.baselineKm, 'item.baselineKm');
  }

  const referenceKm = resolveBaselineKm(item, vehicle);

  if (vehicle.odometerKm < referenceKm) {
    throw new OdometerDecreasedError(referenceKm, vehicle.odometerKm);
  }

  if (!Number.isFinite(avgKmPerDay) || avgKmPerDay <= 0) {
    return null;
  }

  const dueKm = referenceKm + item.intervalKm;
  const remainingKm = dueKm - vehicle.odometerKm;
  const days =
    remainingKm >= 0 ? Math.ceil(remainingKm / avgKmPerDay) : Math.floor(remainingKm / avgKmPerDay);
  const baselineDate = parseIsoDate(vehicle.odometerUpdatedAt);

  return addDaysUtc(baselineDate, days).toISOString();
}
