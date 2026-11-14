import Storage from 'expo-sqlite/kv-store';

import {
  normalizeWeeklyReminderSchedule,
  type WeeklyReminderSchedule,
} from '@/domain/weekly-reminder';

const NOTIFICATIONS_ENABLED_KEY = 'notifications.enabled';
const WEEKLY_REMINDER_KEY = 'notifications.weeklyReminder';
const PERMISSION_PROMPTED_KEY = 'notifications.permissionPrompted';

export class NotificationSettingsRepository {
  /**
   * Lembretes ficam ativos por padrão. Só é `false` se o usuário desligou
   * explicitamente ou se a permissão do sistema foi negada no primeiro aviso.
   */
  async isEnabled(): Promise<boolean> {
    const raw = await Storage.getItemAsync(NOTIFICATIONS_ENABLED_KEY);

    return raw === null ? true : raw === 'true';
  }

  async hasPromptedPermission(): Promise<boolean> {
    return (await Storage.getItemAsync(PERMISSION_PROMPTED_KEY)) === 'true';
  }

  async markPermissionPrompted(): Promise<void> {
    await Storage.setItemAsync(PERMISSION_PROMPTED_KEY, 'true');
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await Storage.setItemAsync(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
  }

  async getWeeklyReminder(): Promise<WeeklyReminderSchedule> {
    const raw = await Storage.getItemAsync(WEEKLY_REMINDER_KEY);

    if (raw === null) {
      return normalizeWeeklyReminderSchedule(null);
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      return normalizeWeeklyReminderSchedule(parsed);
    } catch {
      return normalizeWeeklyReminderSchedule(null);
    }
  }

  async setWeeklyReminder(schedule: WeeklyReminderSchedule): Promise<void> {
    await Storage.setItemAsync(
      WEEKLY_REMINDER_KEY,
      JSON.stringify(normalizeWeeklyReminderSchedule(schedule)),
    );
  }
}
