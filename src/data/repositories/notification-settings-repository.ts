import Storage from 'expo-sqlite/kv-store';

const NOTIFICATIONS_ENABLED_KEY = 'notifications.enabled';

export class NotificationSettingsRepository {
  async isEnabled(): Promise<boolean> {
    return (await Storage.getItemAsync(NOTIFICATIONS_ENABLED_KEY)) === 'true';
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await Storage.setItemAsync(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
  }
}
