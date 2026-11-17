import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseGate } from '@/data/db/database-gate';
import '@/notifications/notification-handler';
import { InitialNotificationPermissionPrompt } from '@/notifications/initial-permission-prompt';
import { NotificationResponseHandler } from '@/notifications/notification-response-handler';
import { useThemeColors } from '@/theme';

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <SafeAreaProvider>
      <DatabaseGate>
        <NotificationResponseHandler />
        <InitialNotificationPermissionPrompt />
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
      </DatabaseGate>
    </SafeAreaProvider>
  );
}
