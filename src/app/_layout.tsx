import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseGate } from '@/data/db/database-gate';

export default function RootLayout() {
  return (
    <DatabaseGate>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </DatabaseGate>
  );
}
