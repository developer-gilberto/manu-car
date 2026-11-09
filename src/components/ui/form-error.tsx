import { StyleSheet, Text, View } from 'react-native';

import { type Palette, radius, spacing, useThemedStyles } from '@/theme';

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  const styles = useThemedStyles(createStyles);
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    text: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
    },
  });
