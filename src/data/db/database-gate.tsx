import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Palette, useThemedStyles } from '@/theme';

import { getDatabase } from './client';
import migrations from './migrations/migrations';

const database = getDatabase();

export function DatabaseGate({ children }: PropsWithChildren) {
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    detail: {
      fontSize: 14,
      color: colors.danger,
      textAlign: 'center',
    },
  });
