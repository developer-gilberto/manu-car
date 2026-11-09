import * as Notifications from 'expo-notifications';

import { getRepositories } from '@/data/repositories';
import {
  buildNotificationPlan,
  calcAvgKmPerDay,
  createWeeklyOdometerNotification,
  type MaintenanceNotificationPlanEntry,
  type NotificationPlanEntry,
} from '@/domain';
import { colors } from '@/theme';
import { getErrorMessage } from '@/utils/errors';

import {
  ANDROID_NOTIFICATION_CHANNEL_ID,
  ensureAndroidNotificationChannel,
} from './android-channel';
import { getNotificationPermissionInfo } from './permissions';

export interface RefreshNotificationsResult {
  scheduledCount: number;
  error: string | null;
}

const REMINDER_HOUR = 9;

/**
 * Próximo horário de 09:00 no fuso local estritamente depois de `from`.
 */
function nextReminderHour(from: Date): Date {
  const next = new Date(from);
  next.setHours(REMINDER_HOUR, 0, 0, 0);

  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Itens vencidos ou com data já passada não disparam imediatamente: avisam no
 * próximo 09:00. Assim, abrir o app não gera um alerta surpresa.
 */
function maintenanceTriggerDate(entry: MaintenanceNotificationPlanEntry, now: Date): Date {
  if (!entry.overdue) {
    const scheduled = new Date(
      `${entry.scheduledDate}T${String(REMINDER_HOUR).padStart(2, '0')}:00:00`,
    );

    if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() > now.getTime()) {
      return scheduled;
    }
  }

  return nextReminderHour(now);
}

function buildNotificationRequest(
  entry: NotificationPlanEntry,
  now: Date,
): Notifications.NotificationRequestInput {
  if (entry.type === 'weekly-odometer') {
    return {
      content: {
        title: entry.title,
        body: entry.body,
        data: { kind: entry.type },
        sound: 'default',
        color: colors.primary,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: entry.weekday,
        hour: entry.hour,
        minute: entry.minute,
        channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
      },
    };
  }

  return {
    content: {
      title: entry.title,
      body: entry.body,
      data: {
        kind: entry.type,
        vehicleId: entry.vehicleId,
        itemId: entry.itemId,
      },
      sound: 'default',
      color: colors.primary,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: maintenanceTriggerDate(entry, now),
      channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
    },
  };
}

/**
 * Execuções concorrentes (ex.: duas mutações seguidas) não podem intercalar
 * "cancelar tudo" com "agendar", senão surgem avisos duplicados.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);

  return run;
}

async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Remove todos os lembretes agendados pelo app. */
export function cancelScheduledNotifications(): Promise<void> {
  return enqueue(cancelAll);
}

/**
 * Cancela tudo e reagenda a partir do estado atual do banco. Não pede
 * permissão: só age se o usuário já ativou lembretes e a permissão está concedida.
 */
export function refreshScheduledNotifications(
  now = new Date().toISOString(),
): Promise<RefreshNotificationsResult> {
  return enqueue(async () => {
    try {
      const repositories = getRepositories();
      const enabled = await repositories.notificationSettings.isEnabled();

      if (!enabled) {
        await cancelAll();
        return { scheduledCount: 0, error: null };
      }

      const permission = await getNotificationPermissionInfo();

      if (permission.state !== 'granted') {
        await cancelAll();
        return { scheduledCount: 0, error: 'Permissão de notificações não concedida.' };
      }

      await ensureAndroidNotificationChannel();

      const vehicles = repositories.vehicles.list();
      const entries: NotificationPlanEntry[] = [];

      for (const vehicle of vehicles) {
        const items = repositories.maintenanceItems.listByVehicle(vehicle.id);
        const readings = repositories.odometer.listByVehicle(vehicle.id);
        const avgKmPerDay = calcAvgKmPerDay(
          readings.map((reading) => ({ km: reading.km, readAt: reading.readAt })),
          now,
        );

        entries.push(
          ...buildNotificationPlan(
            items.map((item) => ({
              id: item.id,
              name: item.name,
              intervalKm: item.intervalKm,
              intervalMonths: item.intervalMonths,
              lastDoneKm: item.lastDoneKm,
              lastDoneAt: item.lastDoneAt,
              notifyEnabled: item.notifyEnabled,
              archived: item.archived,
            })),
            {
              id: vehicle.id,
              name: vehicle.name,
              odometerKm: vehicle.odometerKm,
              odometerUpdatedAt: vehicle.odometerUpdatedAt,
            },
            now,
            { avgKmPerDay, includeWeeklyReminder: false },
          ),
        );
      }

      // Lembrete semanal de odômetro: uma única vez, se houver algum veículo.
      if (vehicles.length > 0) {
        entries.push(createWeeklyOdometerNotification());
      }

      await cancelAll();

      const triggerBase = new Date(now);
      let scheduledCount = 0;
      let firstError: string | null = null;

      for (const entry of entries) {
        try {
          await Notifications.scheduleNotificationAsync(
            buildNotificationRequest(entry, triggerBase),
          );
          scheduledCount += 1;
        } catch (error) {
          firstError ??= getErrorMessage(error);
        }
      }

      return { scheduledCount, error: firstError };
    } catch (error) {
      return { scheduledCount: 0, error: getErrorMessage(error) };
    }
  });
}
