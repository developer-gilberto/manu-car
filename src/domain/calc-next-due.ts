import { resolveBaselineAt, resolveBaselineKm } from './baseline';
import { addMonthsUtc, parseIsoDate } from './date-utils';
import { OdometerDecreasedError } from './errors';
import type { MaintenanceItemSnapshot, NextDue, VehicleSnapshot } from './types';
import { assertValidInterval, assertValidOdometerKm } from './validation';

function assertValidBaseline(item: MaintenanceItemSnapshot, vehicle: VehicleSnapshot): void {
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
}

export function calcNextDue(item: MaintenanceItemSnapshot, vehicle: VehicleSnapshot): NextDue {
  assertValidOdometerKm(vehicle.odometerKm, 'vehicle.odometerKm');
  assertValidInterval(item.intervalKm, 'item.intervalKm');
  assertValidInterval(item.intervalMonths, 'item.intervalMonths');
  assertValidBaseline(item, vehicle);

  const dueKm =
    item.intervalKm === null ? null : resolveBaselineKm(item, vehicle) + item.intervalKm;

  let dueAt: string | null = null;

  if (item.intervalMonths !== null) {
    const baselineAt = resolveBaselineAt(item, vehicle);
    dueAt = addMonthsUtc(parseIsoDate(baselineAt), item.intervalMonths).toISOString();
  }

  return { dueKm, dueAt };
}
