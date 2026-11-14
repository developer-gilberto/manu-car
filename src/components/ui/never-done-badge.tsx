import { StyleSheet, Text, View } from 'react-native';

import { type Palette, radius, spacing, useThemedStyles } from '@/theme';

/** Indica que o item não tem nenhum registro de execução. */
export function NeverDoneBadge() {
  const styles = useThemedStyles(createStyles);

  return (
    <View accessibilityLabel="Nunca feito" style={styles.badge}>
      <Text style={styles.text}>Nunca feito</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    badge: {
      backgroundColor: colors.warningSoft,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    text: {
      color: colors.warningText,
      fontSize: 11,
      fontWeight: '700',
    },
  });
