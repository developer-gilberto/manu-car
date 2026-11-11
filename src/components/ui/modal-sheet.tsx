import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Palette, radius, spacing, useThemedStyles } from '@/theme';

interface ModalSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
}

export function ModalSheet({ visible, title, onClose, children }: ModalSheetProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: spacing.xl + insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable hitSlop={8} onPress={onClose}>
              <Text style={styles.close}>Fechar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '90%',
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: spacing.md,
    },
    title: {
      color: colors.text,
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
    },
    close: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.lg,
    },
  });
