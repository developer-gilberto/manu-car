import { calcNextDue } from './calc-next-due';
import { calcStatus } from './calc-status';
import { parseIsoDate } from './date-utils';
import { estimateDueDate } from './estimate-due-date';
import type { MaintenanceItemSnapshot, MaintenanceStatus, VehicleSnapshot } from './types';

export interface NotificationMaintenanceItem extends MaintenanceItemSnapshot {
  id: number;
  name: string;
  archived: boolean;
  notifyEnabled: boolean;
}

export interface NotificationVehicle extends VehicleSnapshot {
  id: number;
  name: string;
}

export interface MaintenanceNotificationPlanEntry {
  type: 'maintenance';
  key: string;
  vehicleId: number;
  itemId: number;
  title: string;
  body: string;
  scheduledDate: string;
  estimated: boolean;
  overdue: boolean;
  status: MaintenanceStatus;
}

export interface WeeklyOdometerNotificationPlanEntry {
  type: 'weekly-odometer';
  key: typeof WEEKLY_ODOMETER_NOTIFICATION_KEY;
  title: string;
  body: string;
  weekday: number;
  hour: number;
  minute: number;
}

export type NotificationPlanEntry =
  MaintenanceNotificationPlanEntry | WeeklyOdometerNotificationPlanEntry;

export interface NotificationPlanOptions {
  avgKmPerDay?: number;
  includeWeeklyReminder?: boolean;
}

export const WEEKLY_ODOMETER_NOTIFICATION_KEY = 'weekly-odometer';
export const WEEKLY_ODOMETER_WEEKDAY = 2;
export const WEEKLY_ODOMETER_HOUR = 9;
export const WEEKLY_ODOMETER_MINUTE = 0;

function toDateKey(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');

  return `${day}/${month}/${year}`;
}

function buildMaintenanceEntry(
  item: NotificationMaintenanceItem,
  vehicle: NotificationVehicle,
  now: string,
  avgKmPerDay: number,
): MaintenanceNotificationPlanEntry | null {
  const due = calcNextDue(item, vehicle);
  const estimatedDueAt = estimateDueDate(item, vehicle, avgKmPerDay);
  const candidates: { date: Date; estimated: boolean }[] = [];

  if (due.dueAt !== null) {
    candidates.push({ date: parseIsoDate(due.dueAt), estimated: false });
  }

  if (estimatedDueAt !== null) {
    candidates.push({ date: parseIsoDate(estimatedDueAt), estimated: true });
  }

  if (candidates.length === 0) {
    return null;
  }

  const selected = candidates.reduce((earliest, candidate) =>
    candidate.date.getTime() < earliest.date.getTime() ? candidate : earliest,
  );
  const status = calcStatus(item, vehicle, now);
  const overdue = status === 'vencido';
  const scheduledDate = toDateKey(selected.date);
  const title = overdue ? `Manutenção vencida: ${item.name}` : `Manutenção próxima: ${item.name}`;
  const body = overdue
    ? `${vehicle.name}: ${item.name} está vencido. Registre a manutenção ou atualize o odômetro.`
    : selected.estimated
      ? `${vehicle.name}: ${item.name} tem previsão por km para ${formatDateKey(scheduledDate)}.`
      : `${vehicle.name}: ${item.name} vence em ${formatDateKey(scheduledDate)}.`;

  return {
    type: 'maintenance',
    key: `maintenance:${vehicle.id}:${item.id}`,
    vehicleId: vehicle.id,
    itemId: item.id,
    title,
    body,
    scheduledDate,
    estimated: selected.estimated,
    overdue,
    status,
  };
}

export function createWeeklyOdometerNotification(): WeeklyOdometerNotificationPlanEntry {
  return {
    type: 'weekly-odometer',
    key: WEEKLY_ODOMETER_NOTIFICATION_KEY,
    title: 'Atualize a quilometragem do carro',
    body: 'Abra o Manu Car e informe o odômetro atual para manter os lembretes de manutenção em dia.',
    weekday: WEEKLY_ODOMETER_WEEKDAY,
    hour: WEEKLY_ODOMETER_HOUR,
    minute: WEEKLY_ODOMETER_MINUTE,
  };
}

export function buildNotificationPlan(
  items: readonly NotificationMaintenanceItem[],
  vehicle: NotificationVehicle,
  now: string,
  options: NotificationPlanOptions = {},
): NotificationPlanEntry[] {
  parseIsoDate(now);

  const avgKmPerDay = options.avgKmPerDay ?? 0;
  const entries: NotificationPlanEntry[] = [];

  for (const item of items) {
    if (item.archived || !item.notifyEnabled) {
      continue;
    }

    try {
      const entry = buildMaintenanceEntry(item, vehicle, now, avgKmPerDay);

      if (entry !== null) {
        entries.push(entry);
      }
    } catch {
      continue;
    }
  }

  if (options.includeWeeklyReminder ?? true) {
    entries.push(createWeeklyOdometerNotification());
  }

  return entries;
}
