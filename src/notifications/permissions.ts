import { PermissionStatus } from 'expo';
import * as Notifications from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';
import { Linking } from 'react-native';

import { ensureAndroidNotificationChannel } from './android-channel';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionInfo {
  state: NotificationPermissionState;
  canAskAgain: boolean;
}

function toPermissionInfo(
  status: Notifications.NotificationPermissionsStatus,
): NotificationPermissionInfo {
  const provisional = status.ios?.status === IosAuthorizationStatus.PROVISIONAL;

  if (status.granted || provisional) {
    return { state: 'granted', canAskAgain: status.canAskAgain };
  }

  if (status.status === PermissionStatus.DENIED) {
    return { state: 'denied', canAskAgain: status.canAskAgain };
  }

  return { state: 'undetermined', canAskAgain: status.canAskAgain };
}

export async function getNotificationPermissionInfo(): Promise<NotificationPermissionInfo> {
  return toPermissionInfo(await Notifications.getPermissionsAsync());
}

export async function ensureNotificationPermission(): Promise<NotificationPermissionInfo> {
  await ensureAndroidNotificationChannel();

  const current = await getNotificationPermissionInfo();

  if (current.state === 'granted' || !current.canAskAgain) {
    return current;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return toPermissionInfo(requested);
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}
