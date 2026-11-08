import { addMonthsUtc, parseIsoDate } from './date-utils';
import { OdometerDecreasedError } from './errors';
import type { MaintenanceItemSnapshot, NextDue, VehicleSnapshot } from './types';
import { assertValidInterval, assertValidOdometerKm } from './validation';

export function calcNextDue(item: MaintenanceItemSnapshot, vehicle: VehicleSnapshot): NextDue {
  assertValidOdometerKm(vehicle.odometerKm, 'vehicle.odometerKm');
  assertValidInterval(item.intervalKm, 'item.intervalKm');
  assertValidInterval(item.intervalMonths, 'item.intervalMonths');

  if (item.lastDoneKm !== null) {
    assertValidOdometerKm(item.lastDoneKm, 'item.lastDoneKm');

    if (vehicle.odometerKm < item.lastDoneKm) {
      throw new OdometerDecreasedError(item.lastDoneKm, vehicle.odometerKm);
    }
  }

  const dueKm =
    item.intervalKm === null ? null : (item.lastDoneKm ?? vehicle.odometerKm) + item.intervalKm;

  let dueAt: string | null = null;

  if (item.intervalMonths !== null) {
    const baselineAt = item.lastDoneAt ?? vehicle.odometerUpdatedAt;
    dueAt = addMonthsUtc(parseIsoDate(baselineAt), item.intervalMonths).toISOString();
  }

  return { dueKm, dueAt };
}
