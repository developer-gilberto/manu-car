import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Palette, radius, spacing, useThemedStyles, useThemeColors } from '@/theme';

interface WarningBannerProps {
  text?: string;
}

export function WarningBanner({
  text = 'Os intervalos padrão são genéricos. Consulte o manual do seu carro antes de agendar a manutenção.',
}: WarningBannerProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Atenção</Text>
        <Pressable
          accessibilityLabel="Fechar aviso"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setDismissed(true)}
        >
          <Feather color={colors.warning} name="x" size={18} />
        </Pressable>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.warningSoft,
      borderColor: colors.warningBorder,
      borderRadius: radius.md,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.md,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: '700',
    },
    text: {
      color: colors.warningText,
      fontSize: 13,
      lineHeight: 18,
    },
  });
