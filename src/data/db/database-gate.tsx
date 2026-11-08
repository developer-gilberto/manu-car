import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getDatabase } from './client';
import migrations from './migrations/migrations';

const database = getDatabase();

export function DatabaseGate({ children }: PropsWithChildren) {
  const { success, error } = useMigrations(database, migrations);

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Não foi possível preparar o banco de dados.</Text>
        <Text style={styles.detail}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Preparando o banco de dados...</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  detail: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
  },
});
