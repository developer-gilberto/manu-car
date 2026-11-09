import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { type Palette, spacing, useThemedStyles } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = false, contentContainerStyle }: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  if (scroll) {
    return (
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        style={styles.root}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, styles.content, contentContainerStyle]}>{children}</View>;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
  });
