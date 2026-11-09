import { AndroidImportance, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/theme';

export const ANDROID_NOTIFICATION_CHANNEL_ID = 'maintenance';

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
    name: 'Lembretes de manutenção',
    description: 'Avisos de manutenção e de atualização do odômetro.',
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.primary,
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });
}
