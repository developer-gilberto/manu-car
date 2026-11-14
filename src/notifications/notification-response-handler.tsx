import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { resolveNotificationTarget } from './notification-target';

/**
 * Navega quando o usuário toca em uma notificação, inclusive com o app fechado.
 * Fica dentro do DatabaseGate para só agir depois que as migrations terminam.
 */
export function NotificationResponseHandler() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }

    router.navigate(resolveNotificationTarget(response.notification.request.content.data));
    Notifications.clearLastNotificationResponse();
  }, [response]);

  return null;
}
