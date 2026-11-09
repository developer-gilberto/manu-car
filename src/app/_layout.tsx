import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseGate } from '@/data/db/database-gate';
import '@/notifications/notification-handler';
import { colors } from '@/theme';

export default function RootLayout() {
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
