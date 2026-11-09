import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SwitchField } from '@/components/ui/switch-field';
import { getRepositories } from '@/data/repositories';
import {
  cancelScheduledNotifications,
  refreshScheduledNotifications,
} from '@/notifications/scheduler';
import {
  ensureNotificationPermission,
  getNotificationPermissionInfo,
  openNotificationSettings,
} from '@/notifications/permissions';
import { colors, radius, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/errors';

function ComingSoonBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>Em breve</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const repositories = useMemo(() => getRepositories(), []);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const isEnabled = await repositories.notificationSettings.isEnabled();
        const permission = isEnabled ? await getNotificationPermissionInfo() : null;

        if (active) {
          setEnabled(isEnabled);
          setPermissionBlocked(permission !== null && permission.state !== 'granted');
        }
      } catch (error) {
        if (active) {
          setMessage(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [repositories]);

  const handleToggle = async (value: boolean) => {
    setBusy(true);
    setMessage(null);

    try {
      if (!value) {
        await repositories.notificationSettings.setEnabled(false);
        await cancelScheduledNotifications();
        setEnabled(false);
        setPermissionBlocked(false);
        return;
      }

      // A permissão só é pedida aqui, quando o usuário ativa os lembretes.
      const permission = await ensureNotificationPermission();

      if (permission.state !== 'granted') {
        setEnabled(false);
        setPermissionBlocked(true);
        return;
      }

      await repositories.notificationSettings.setEnabled(true);
      setEnabled(true);
      setPermissionBlocked(false);

      const result = await refreshScheduledNotifications();

      setMessage(
        result.error
          ? `Não foi possível agendar os lembretes: ${result.error}`
          : `Lembretes ativados. ${result.scheduledCount} aviso(s) agendado(s).`,
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Configurações' }} />

      <Card style={styles.card}>
        <Text style={styles.title}>Notificações</Text>
        <SwitchField
          description="Avisos de manutenção próxima ou vencida e um lembrete semanal para atualizar a quilometragem."
          disabled={loading || busy}
          label="Lembretes de manutenção"
          onValueChange={(value) => void handleToggle(value)}
          value={enabled}
        />

        {permissionBlocked ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>Notificações bloqueadas</Text>
            <Text style={styles.warningText}>
              Você negou a permissão de notificações para o Manu Car. Libere-a nas configurações do
              sistema para receber os lembretes.
            </Text>
            <Button
              onPress={() => void openNotificationSettings()}
              title="Abrir configurações do sistema"
              variant="secondary"
            />
          </View>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}
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
  warning: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  warningTitle: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
