import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { WarningBanner } from '@/components/ui/warning-banner';
import type { MaintenanceItem, MaintenanceLog, Vehicle } from '@/data/db/schema';
import { getRepositories } from '@/data/repositories';
import { refreshScheduledNotifications } from '@/notifications/scheduler';
import { calcAvgKmPerDay } from '@/domain';
import { MarkDoneModal, type MarkDoneFormOutput } from '@/forms/mark-done-modal';
import { colors, spacing } from '@/theme';
import { formatCents } from '@/utils/currency';
import { formatDate, formatKm } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import {
  buildMaintenanceItemView,
  getDueSummary,
  getEstimatedLabel,
} from '@/utils/maintenance-view';
import { parsePositiveInteger } from '@/utils/numbers';

interface DetailData {
  item: MaintenanceItem;
  vehicle: Vehicle;
  logs: MaintenanceLog[];
  readings: { km: number; readAt: string }[];
}

function formatInterval(item: MaintenanceItem): string {
  const parts: string[] = [];

  if (item.intervalKm !== null) {
    parts.push(`a cada ${formatKm(item.intervalKm)}`);
  }

  if (item.intervalMonths !== null) {
    parts.push(`a cada ${item.intervalMonths} ${item.intervalMonths === 1 ? 'mês' : 'meses'}`);
  }

  return parts.length > 0 ? parts.join(' ou ') : 'Sem intervalo definido';
}

function formatLastDone(item: MaintenanceItem): string {
  if (item.lastDoneKm === null && item.lastDoneAt === null) {
    return 'Nunca registrada';
  }

  const km = item.lastDoneKm === null ? 'km não informado' : formatKm(item.lastDoneKm);
  const date = item.lastDoneAt ? formatDate(item.lastDoneAt) : 'data não informada';

  return `${km} em ${date}`;
}

export default function ItemDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = params.id ? parsePositiveInteger(params.id) : null;
  const repositories = useMemo(() => getRepositories(), []);
  const [data, setData] = useState<DetailData | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markDoneVisible, setMarkDoneVisible] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      if (itemId === null) {
        throw new Error('Item inválido.');
      }

      const item = repositories.maintenanceItems.getById(itemId);

      if (!item) {
        throw new Error('Item não encontrado.');
      }

      const vehicle = repositories.vehicles.getById(item.vehicleId);

      if (!vehicle) {
        throw new Error('Veículo não encontrado.');
      }

      setData({
        item,
        vehicle,
        logs: repositories.logs.listByItem(item.id),
        readings: repositories.odometer.listByVehicle(vehicle.id),
      });
      setNow(new Date().toISOString());
    } catch (loadError) {
      setData(null);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [itemId, repositories]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const avgKmPerDay = useMemo(() => (data ? calcAvgKmPerDay(data.readings, now) : 0), [data, now]);
  const view = useMemo(
    () => (data ? buildMaintenanceItemView(data.item, data.vehicle, avgKmPerDay, now) : null),
    [avgKmPerDay, data, now],
  );

  const handleMarkDone = async (output: MarkDoneFormOutput) => {
    if (!data) {
      return;
    }

    repositories.logs.create({
      costCents: output.costCents,
      doneAt: output.doneAt,
      itemId: data.item.id,
      km: output.km,
      notes: output.notes,
    });
    repositories.maintenanceItems.update(data.item.id, {
      lastDoneAt: output.doneAt,
      lastDoneKm: output.km,
    });
    load();
    void refreshScheduledNotifications();
  };

  const dueLines = view ? getDueSummary(view) : [];
  const estimatedLabel = view ? getEstimatedLabel(view) : null;

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          headerRight: data
            ? () => (
                <ActionLink
                  href={{
                    pathname: '/items/[id]/edit',
                    params: { id: String(data.item.id) },
                  }}
                  label="Editar"
                />
              )
            : undefined,
          title: data?.item.name ?? 'Item',
        }}
      />

      {loading ? (
        <LoadingState message="Carregando item..." />
      ) : error || !data || !view ? (
        <EmptyState
          actionLabel="Voltar"
          description={error ?? 'Não foi possível carregar este item.'}
          onAction={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
          title="Item indisponível"
        />
      ) : (
        <>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.itemName}>{data.item.name}</Text>
              <StatusBadge status={view.status} />
            </View>
            <View style={styles.dueList}>
              {dueLines.map((line) => (
                <Text key={line} style={styles.dueText}>
                  {line}
                </Text>
              ))}
            </View>
            {estimatedLabel ? <Text style={styles.estimateText}>{estimatedLabel}</Text> : null}
            <Button onPress={() => setMarkDoneVisible(true)} title="Marcar como feito" />
          </Card>

          <WarningBanner />

          <Card style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Detalhes</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Intervalo</Text>
              <Text style={styles.detailValue}>{formatInterval(data.item)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Última manutenção</Text>
              <Text style={styles.detailValue}>{formatLastDone(data.item)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lembrete</Text>
              <Text style={styles.detailValue}>
                {data.item.notifyEnabled ? 'Ativado (em breve)' : 'Desativado'}
              </Text>
            </View>
          </Card>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            <Text style={styles.historyCount}>
              {data.logs.length} registro{data.logs.length === 1 ? '' : 's'}
            </Text>
          </View>

          {data.logs.length === 0 ? (
            <EmptyState
              description="Quando você marcar este item como feito, as execuções aparecem aqui."
              title="Nenhuma execução registrada"
            />
          ) : (
            <View style={styles.logList}>
              {data.logs.map((log) => (
                <Card key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logDate}>{formatDate(log.doneAt)}</Text>
                    <Text style={styles.logKm}>{formatKm(log.km)}</Text>
                  </View>
                  <Text style={styles.logCost}>Custo: {formatCents(log.costCents)}</Text>
                  {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
                </Card>
              ))}
            </View>
          )}

          <MarkDoneModal
            item={data.item}
            onClose={() => setMarkDoneVisible(false)}
            onSubmit={handleMarkDone}
            vehicle={data.vehicle}
            visible={markDoneVisible}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    gap: spacing.md,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  itemName: {
    color: colors.text,
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dueList: {
    gap: spacing.xs,
  },
  dueText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  estimateText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailsCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCount: {
    color: colors.textMuted,
    fontSize: 12,
  },
  logList: {
    gap: spacing.md,
  },
  logCard: {
    gap: spacing.sm,
  },
  logHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logDate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  logKm: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  logCost: {
    color: colors.textMuted,
    fontSize: 13,
  },
  logNotes: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});
