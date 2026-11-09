import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionLink } from '@/components/ui/action-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { WarningBanner } from '@/components/ui/warning-banner';
import type { MaintenanceItem, OdometerReading, Vehicle } from '@/data/db/schema';
import { getRepositories } from '@/data/repositories';
import { calcAvgKmPerDay } from '@/domain';
import { OdometerModal, type OdometerFormOutput } from '@/forms/odometer-modal';
import { refreshScheduledNotifications } from '@/notifications/scheduler';
import { type Palette, radius, spacing, useThemedStyles } from '@/theme';
import { formatDate, formatKm } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import {
  buildMaintenanceItemView,
  getDueSummary,
  getEstimatedLabel,
  sortMaintenanceViews,
} from '@/utils/maintenance-view';

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const repositories = useMemo(() => getRepositories(), []);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [readings, setReadings] = useState<OdometerReading[]>([]);
  const [now, setNow] = useState(() => new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [odometerVisible, setOdometerVisible] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const vehicleList = repositories.vehicles.list();
      const nextSelectedId = vehicleList.some((vehicle) => vehicle.id === selectedVehicleId)
        ? selectedVehicleId
        : (vehicleList[0]?.id ?? null);

      setVehicles(vehicleList);
      setSelectedVehicleId(nextSelectedId);

      if (nextSelectedId === null) {
        setItems([]);
        setReadings([]);
      } else {
        setItems(repositories.maintenanceItems.listByVehicle(nextSelectedId));
        setReadings(repositories.odometer.listByVehicle(nextSelectedId));
      }

      setNow(new Date().toISOString());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [repositories, selectedVehicleId]);

  useFocusEffect(
    useCallback(() => {
      load();
      // Reavalia os avisos: o tempo passa mesmo sem nenhuma mutação.
      void refreshScheduledNotifications();
    }, [load]),
  );

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
  const avgKmPerDay = useMemo(
    () =>
      calcAvgKmPerDay(
        readings.map((reading) => ({
          km: reading.km,
          readAt: reading.readAt,
        })),
        now,
      ),
    [now, readings],
  );
  const views = useMemo(() => {
    if (!selectedVehicle) {
      return [];
    }

    return sortMaintenanceViews(
      items
        .filter((item) => !item.archived)
        .map((item) => buildMaintenanceItemView(item, selectedVehicle, avgKmPerDay, now)),
    );
  }, [avgKmPerDay, items, now, selectedVehicle]);

  const handleOdometerSubmit = async ({ km, readAt }: OdometerFormOutput) => {
    if (!selectedVehicle) {
      return;
    }

    repositories.odometer.create({
      vehicleId: selectedVehicle.id,
      km,
      readAt,
    });
    repositories.vehicles.update(selectedVehicle.id, {
      odometerKm: km,
      odometerUpdatedAt: readAt,
    });
    load();
    void refreshScheduledNotifications();
  };

  const openNewItem = () => {
    if (!selectedVehicle) {
      return;
    }

    router.push({
      pathname: '/items/new',
      params: { vehicleId: String(selectedVehicle.id) },
    });
  };

  const openNewVehicle = () => {
    router.push('/vehicles/new');
  };

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          headerRight: () => <ActionLink href="/settings" label="Ajustes" />,
          title: 'Manu Car',
        }}
      />

      {loading ? (
        <LoadingState message="Carregando seus veículos..." />
      ) : error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={load} title="Tentar novamente" variant="ghost" />
        </Card>
      ) : vehicles.length === 0 || !selectedVehicle ? (
        <EmptyState
          actionLabel="Cadastrar veículo"
          description="Cadastre seu carro para acompanhar as manutenções e a quilometragem."
          onAction={openNewVehicle}
          title="Nenhum veículo cadastrado"
        />
      ) : (
        <>
          {vehicles.length > 1 ? (
            <ScrollView
              contentContainerStyle={styles.vehicleChips}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {vehicles.map((vehicle) => {
                const selected = vehicle.id === selectedVehicle.id;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={vehicle.id}
                    onPress={() => setSelectedVehicleId(vehicle.id)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                      {vehicle.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Card style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleTitleContainer}>
                <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                {selectedVehicle.plate ? (
                  <Text style={styles.plate}>{selectedVehicle.plate}</Text>
                ) : null}
              </View>
              <ActionLink
                href={{
                  pathname: '/vehicles/[id]/edit',
                  params: { id: String(selectedVehicle.id) },
                }}
                label="Editar"
              />
            </View>
            <View>
              <Text style={styles.label}>Odômetro atual</Text>
              <Text style={styles.odometer}>{formatKm(selectedVehicle.odometerKm)}</Text>
              <Text style={styles.updated}>
                Atualizado em {formatDate(selectedVehicle.odometerUpdatedAt)}
              </Text>
            </View>
            <Button onPress={() => setOdometerVisible(true)} title="Atualizar odômetro" />
          </Card>

          <WarningBanner />

          <SectionHeader
            action={
              <ActionLink
                href={{
                  pathname: '/items/new',
                  params: { vehicleId: String(selectedVehicle.id) },
                }}
                label="+ Novo item"
              />
            }
            subtitle={`${views.length} item${views.length === 1 ? '' : 's'} acompanhado${views.length === 1 ? '' : 's'}`}
            title="Manutenções"
          />

          {views.length === 0 ? (
            <EmptyState
              actionLabel="Criar item"
              description="Adicione um item de manutenção para começar a acompanhar os vencimentos."
              onAction={openNewItem}
              title="Nenhum item de manutenção"
            />
          ) : (
            <View style={styles.itemList}>
              {views.map((view) => {
                const dueLines = getDueSummary(view);
                const estimatedLabel = getEstimatedLabel(view);

                return (
                  <Pressable
                    key={view.item.id}
                    onPress={() =>
                      router.push({
                        pathname: '/items/[id]',
                        params: { id: String(view.item.id) },
                      })
                    }
                    style={({ pressed }) => [styles.itemPressable, pressed ? styles.pressed : null]}
                  >
                    <Card style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{view.item.name}</Text>
                        <StatusBadge status={view.status} />
                      </View>
                      <View style={styles.dueList}>
                        {dueLines.map((line) => (
                          <Text key={line} style={styles.dueText}>
                            {line}
                          </Text>
                        ))}
                      </View>
                      {estimatedLabel ? (
                        <Text style={styles.estimateText}>{estimatedLabel}</Text>
                      ) : null}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.footerActions}>
            <ActionLink href="/vehicles/new" label="+ Novo veículo" />
          </View>
        </>
      )}

      {selectedVehicle ? (
        <OdometerModal
          onClose={() => setOdometerVisible(false)}
          onSubmit={handleOdometerSubmit}
          vehicle={selectedVehicle}
          visible={odometerVisible}
        />
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    vehicleChips: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    chipTextSelected: {
      color: colors.white,
    },
    vehicleCard: {
      gap: spacing.lg,
    },
    vehicleHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between',
    },
    vehicleTitleContainer: {
      flex: 1,
      gap: spacing.xs,
    },
    vehicleName: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
    plate: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    odometer: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '700',
    },
    updated: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: spacing.xs,
    },
    itemList: {
      gap: spacing.md,
    },
    itemPressable: {
      borderRadius: radius.lg,
    },
    pressed: {
      opacity: 0.8,
    },
    itemCard: {
      gap: spacing.sm,
    },
    itemHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between',
    },
    itemName: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    dueList: {
      gap: spacing.xs,
    },
    dueText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    estimateText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    footerActions: {
      alignItems: 'flex-start',
      paddingTop: spacing.sm,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
  });
