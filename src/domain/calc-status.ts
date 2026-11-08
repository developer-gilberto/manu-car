import { calcNextDue } from './calc-next-due';
import { differenceInUtcCalendarDays, parseIsoDate } from './date-utils';
import type { MaintenanceItemSnapshot, MaintenanceStatus, VehicleSnapshot } from './types';

const STATUS_PRIORITY: Record<MaintenanceStatus, number> = {
  ok: 0,
  atencao: 1,
  vencido: 2,
};

function worstStatus(statuses: readonly MaintenanceStatus[]): MaintenanceStatus {
  return statuses.reduce<MaintenanceStatus>(
    (worst, status) => (STATUS_PRIORITY[status] > STATUS_PRIORITY[worst] ? status : worst),
    'ok',
  );
}

export function calcStatus(
  item: MaintenanceItemSnapshot,
  vehicle: VehicleSnapshot,
  now: string,
): MaintenanceStatus {
  const nowDate = parseIsoDate(now);
  const nextDue = calcNextDue(item, vehicle);
  const statuses: MaintenanceStatus[] = [];

  if (nextDue.dueKm !== null && item.intervalKm !== null) {
    const remainingKm = nextDue.dueKm - vehicle.odometerKm;

    if (remainingKm <= 0) {
      statuses.push('vencido');
    } else if (remainingKm <= item.intervalKm * 0.2) {
      statuses.push('atencao');
    } else {
      statuses.push('ok');
    }
  }

  if (nextDue.dueAt !== null && item.intervalMonths !== null) {
    const dueDate = parseIsoDate(nextDue.dueAt);
    const baselineDate = parseIsoDate(item.lastDoneAt ?? vehicle.odometerUpdatedAt);
    const totalDays = differenceInUtcCalendarDays(dueDate, baselineDate);
    const elapsedDays = differenceInUtcCalendarDays(nowDate, baselineDate);

    if (elapsedDays >= totalDays) {
      statuses.push('vencido');
    } else if (totalDays > 0 && elapsedDays >= totalDays * 0.8) {
      statuses.push('atencao');
    } else {
      statuses.push('ok');
    }
  }

  return worstStatus(statuses);
}
