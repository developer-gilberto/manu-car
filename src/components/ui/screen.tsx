import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Palette, spacing, useThemedStyles } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = false, contentContainerStyle }: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  // Com edge-to-edge, o conteúdo vai por baixo da barra de navegação do sistema.
  const insets = useSafeAreaInsets();
  const bottomInset = { paddingBottom: spacing.xxl + insets.bottom };

  if (scroll) {
    // Com edge-to-edge o Android ignora adjustResize: o próprio container
    // precisa reduzir a altura quando o teclado abre.
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={[styles.content, bottomInset, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          style={styles.root}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.root, styles.content, bottomInset, contentContainerStyle]}>
      {children}
    </View>
  );
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
