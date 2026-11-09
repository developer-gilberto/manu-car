import { StyleSheet, Text, View } from 'react-native';

import { type Palette, radius, spacing, useThemedStyles } from '@/theme';

interface WarningBannerProps {
  text?: string;
}

export function WarningBanner({
  text = 'Os intervalos padrão são genéricos. Consulte o manual do seu carro antes de agendar a manutenção.',
}: WarningBannerProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atenção</Text>
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
