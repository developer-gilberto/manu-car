import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { getRepositories } from '@/data/repositories';
import {
  buildBackup,
  parseBackup,
  serializeBackup,
  summarizeBackup,
  type BackupData,
  type BackupError,
  type BackupSummary,
  type ParseBackupResult,
} from '@/domain/backup';
import { refreshScheduledNotifications } from '@/notifications/scheduler';
import { type Palette, radius, spacing, useThemedStyles } from '@/theme';
import { formatDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';

interface ValidBackup {
  data: BackupData;
  summary: BackupSummary;
}

function summaryLines(summary: BackupSummary): string[] {
  return [
    `${summary.vehicles} veículo(s)`,
    `${summary.maintenanceItems} item(ns) de manutenção`,
    `${summary.maintenanceLogs} registro(s) de manutenção`,
    `${summary.odometerReadings} leitura(s) de odômetro`,
  ];
}

export default function BackupScreen() {
  const styles = useThemedStyles(createStyles);
  const repositories = useMemo(() => getRepositories(), []);
  const [pastedText, setPastedText] = useState('');
  const [parseError, setParseError] = useState<BackupError | null>(null);
  const [valid, setValid] = useState<ValidBackup | null>(null);
  const [currentSummary, setCurrentSummary] = useState<BackupSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setMessage(null);
    setBusy(true);

    try {
      const backup = buildBackup(repositories.backup.exportData(), new Date().toISOString());
      const result = await Share.share({
        title: 'Backup Manu Car',
        message: serializeBackup(backup),
      });

      if (result.action === Share.sharedAction) {
        setMessage('Backup exportado. Guarde o conteúdo compartilhado em um lugar seguro.');
      }
    } catch (error) {
      setMessage(`Não foi possível exportar o backup: ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleValidate = () => {
    setMessage(null);
    setValid(null);
    setParseError(null);

    const result: ParseBackupResult = parseBackup(pastedText);

    if (!result.ok) {
      setParseError(result.error);
      return;
    }

    const { backup } = result;

    setCurrentSummary(
      summarizeBackup(buildBackup(repositories.backup.exportData(), new Date().toISOString())),
    );
    setValid({
      data: {
        vehicles: backup.vehicles,
        odometerReadings: backup.odometerReadings,
        maintenanceItems: backup.maintenanceItems,
        maintenanceLogs: backup.maintenanceLogs,
      },
      summary: summarizeBackup(backup),
    });
  };

  const confirmImport = () => {
    if (!valid) {
      return;
    }

    Alert.alert(
      'Substituir todos os dados?',
      'Os veículos, itens, registros e leituras atuais serão apagados e trocados pelo conteúdo do backup. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Substituir',
          style: 'destructive',
          onPress: () => void runImport(valid.data),
        },
      ],
    );
  };

  const runImport = async (data: BackupData) => {
    setBusy(true);
    setMessage(null);

    try {
      repositories.backup.replaceAll(data);
      setValid(null);
      setParseError(null);
      setCurrentSummary(null);
      setPastedText('');
      setMessage('Backup importado. Seus dados foram restaurados.');
      await refreshScheduledNotifications();
    } catch (error) {
      setMessage(
        `A importação foi cancelada e nenhum dado foi alterado. Motivo: ${getErrorMessage(error)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Backup' }} />

      <Card style={styles.card}>
        <Text style={styles.title}>Exportar</Text>
        <Text style={styles.description}>
          Gera um JSON com todos os seus veículos, itens, registros e leituras de odômetro. Escolha
          onde salvar pelo menu de compartilhamento.
        </Text>
        <Button disabled={busy} onPress={() => void handleExport()} title="Exportar backup" />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Importar</Text>
        <Text style={styles.description}>
          Cole aqui o conteúdo JSON de um backup. O arquivo é validado antes de qualquer alteração.
          A importação substitui todos os dados atuais.
        </Text>
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          label="Conteúdo do backup"
          multiline
          onChangeText={(text) => {
            setPastedText(text);
            setValid(null);
            setParseError(null);
          }}
          placeholder='{"schemaVersion": 1, ...}'
          value={pastedText}
        />
        <Button
          disabled={busy || pastedText.trim() === ''}
          onPress={handleValidate}
          title="Validar backup"
          variant="secondary"
        />

        {parseError ? (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>{parseError.message}</Text>
            {parseError.details.map((detail) => (
              <Text key={detail} style={styles.errorText}>
                • {detail}
              </Text>
            ))}
          </View>
        ) : null}

        {valid && currentSummary ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              Backup de {formatDate(valid.summary.exportedAt)}
            </Text>
            <Text style={styles.summaryText}>
              Será importado: {summaryLines(valid.summary).join(', ')}.
            </Text>
            <Text style={styles.summaryText}>
              Dados atuais que serão substituídos: {summaryLines(currentSummary).join(', ')}.
            </Text>
            <Button
              disabled={busy}
              onPress={confirmImport}
              title="Importar e substituir dados"
              variant="danger"
            />
          </View>
        ) : null}
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
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
    error: {
      backgroundColor: colors.dangerSoft,
      borderRadius: radius.md,
      gap: spacing.xs,
      padding: spacing.md,
    },
    errorTitle: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    summary: {
      backgroundColor: colors.warningSoft,
      borderRadius: radius.md,
      gap: spacing.sm,
      padding: spacing.md,
    },
    summaryTitle: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: '700',
    },
    summaryText: {
      color: colors.warningText,
      fontSize: 13,
      lineHeight: 18,
    },
    message: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
  });
