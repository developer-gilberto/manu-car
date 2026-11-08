import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface WarningBannerProps {
  text?: string;
}

export function WarningBanner({
  text = 'Os intervalos padrão são genéricos. Consulte o manual do seu carro antes de agendar a manutenção.',
}: WarningBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atenção</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warningSoft,
    borderColor: '#FDE68A',
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
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
});
