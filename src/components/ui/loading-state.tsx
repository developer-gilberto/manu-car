import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { type Palette, spacing, useThemeColors, useThemedStyles } from '@/theme';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      flex: 1,
      gap: spacing.md,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    message: {
      color: colors.textMuted,
      fontSize: 14,
    },
  });
