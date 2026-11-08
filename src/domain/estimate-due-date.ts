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

    if (vehicle.odometerKm < item.lastDoneKm) {
      throw new OdometerDecreasedError(item.lastDoneKm, vehicle.odometerKm);
    }
  }

  if (!Number.isFinite(avgKmPerDay) || avgKmPerDay <= 0) {
    return null;
  }

  const dueKm = (item.lastDoneKm ?? vehicle.odometerKm) + item.intervalKm;
  const remainingKm = dueKm - vehicle.odometerKm;
  const days =
    remainingKm >= 0 ? Math.ceil(remainingKm / avgKmPerDay) : Math.floor(remainingKm / avgKmPerDay);
  const baselineDate = parseIsoDate(vehicle.odometerUpdatedAt);

  return addDaysUtc(baselineDate, days).toISOString();
}
