import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseGate } from '@/data/db/database-gate';
import '@/notifications/notification-handler';
import { useThemeColors } from '@/theme';

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <DatabaseGate>
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
  );
}
