import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing } from '@/theme';

function ComingSoonBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>Em breve</Text>
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Configurações' }} />

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>Notificações</Text>
          <ComingSoonBadge />
        </View>
        <Text style={styles.description}>
          Lembretes de manutenção e aviso semanal para atualizar a quilometragem serão configurados
          em uma próxima fase.
        </Text>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>Backup</Text>
          <ComingSoonBadge />
        </View>
        <Text style={styles.description}>
          Exportar e importar seus dados para manter o histórico seguro. Esta área ainda é apenas um
          esqueleto.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Sobre</Text>
        <Text style={styles.description}>
          Manu Car 1.0.0{'\n'}
          Seus lembretes de manutenção veicular, offline e no seu bolso.
        </Text>
        <Text style={styles.note}>
          Os intervalos padrão são genéricos. O manual do fabricante prevalece.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    padding: spacing.md,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
});
