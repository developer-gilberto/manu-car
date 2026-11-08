import { calcNextDue, calcStatus, estimateDueDate } from '@/domain';
import type { MaintenanceItemSnapshot, MaintenanceStatus, VehicleSnapshot } from '@/domain';

import { differenceInUtcCalendarDays, formatDate, formatKm } from './date';
import { getErrorMessage } from './errors';

export interface MaintenanceItemViewItem extends MaintenanceItemSnapshot {
  id: number;
  name: string;
  archived: boolean;
}

export interface MaintenanceItemView {
  item: MaintenanceItemViewItem;
  status: MaintenanceStatus;
  dueKm: number | null;
  dueAt: string | null;
  remainingKm: number | null;
  remainingDays: number | null;
  estimatedDueAt: string | null;
  error: string | null;
}

const STATUS_ORDER: Record<MaintenanceStatus, number> = {
  vencido: 0,
  atencao: 1,
  ok: 2,
};

export function buildMaintenanceItemView(
  item: MaintenanceItemViewItem,
  vehicle: VehicleSnapshot,
  avgKmPerDay: number,
  now: string,
): MaintenanceItemView {
  try {
    const due = calcNextDue(item, vehicle);
    const status = calcStatus(item, vehicle, now);
    const remainingKm = due.dueKm === null ? null : due.dueKm - vehicle.odometerKm;
    const remainingDays = due.dueAt === null ? null : differenceInUtcCalendarDays(due.dueAt, now);
    const estimatedDueAt = estimateDueDate(item, vehicle, avgKmPerDay);

    return {
      item,
      status,
      dueKm: due.dueKm,
      dueAt: due.dueAt,
      remainingKm,
      remainingDays,
      estimatedDueAt,
      error: null,
    };
  } catch (error) {
    return {
      item,
      status: 'atencao',
      dueKm: null,
      dueAt: null,
      remainingKm: null,
      remainingDays: null,
      estimatedDueAt: null,
      error: getErrorMessage(error),
    };
  }
}

export function getDueSummary(view: MaintenanceItemView): string[] {
  if (view.error) {
    return [view.error];
  }

  const labels: string[] = [];

  if (view.remainingKm !== null) {
    if (view.remainingKm > 0) {
      labels.push(`Faltam ${formatKm(view.remainingKm)}`);
    } else if (view.remainingKm === 0) {
      labels.push('Venceu por km');
    } else {
      labels.push(`Vencido há ${formatKm(Math.abs(view.remainingKm))}`);
    }
  }

  if (view.remainingDays !== null) {
    if (view.remainingDays > 0) {
      labels.push(`Faltam ${view.remainingDays} dia${view.remainingDays === 1 ? '' : 's'}`);
    } else if (view.remainingDays === 0) {
      labels.push('Vence hoje');
    } else {
      const days = Math.abs(view.remainingDays);
      labels.push(`Vencido há ${days} dia${days === 1 ? '' : 's'}`);
    }
  }

  if (labels.length === 0) {
    labels.push('Sem intervalo definido');
  }

  return labels;
}

export function getEstimatedLabel(view: MaintenanceItemView): string | null {
  if (!view.estimatedDueAt) {
    return null;
  }

  return `Previsão por km: ${formatDate(view.estimatedDueAt)}`;
}

export function statusLabel(status: MaintenanceStatus): string {
  if (status === 'vencido') {
    return 'Vencido';
  }

  if (status === 'atencao') {
    return 'Atenção';
  }

  return 'Em dia';
}

export function sortMaintenanceViews(views: readonly MaintenanceItemView[]): MaintenanceItemView[] {
  return [...views].sort((first, second) => {
    const statusDifference = STATUS_ORDER[first.status] - STATUS_ORDER[second.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const firstDate = first.dueAt ?? first.estimatedDueAt;
    const secondDate = second.dueAt ?? second.estimatedDueAt;

    if (firstDate && secondDate) {
      const dateDifference = new Date(firstDate).getTime() - new Date(secondDate).getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }
    } else if (firstDate) {
      return -1;
    } else if (secondDate) {
      return 1;
    }

    return (
      (first.remainingKm ?? Number.POSITIVE_INFINITY) -
      (second.remainingKm ?? Number.POSITIVE_INFINITY)
    );
  });
}
