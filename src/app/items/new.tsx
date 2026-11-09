import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import type { Vehicle } from '@/data/db/schema';
import { getRepositories } from '@/data/repositories';
import { ItemForm, type ItemFormOutput } from '@/forms/item-form';
import { refreshScheduledNotifications } from '@/notifications/scheduler';
import { getErrorMessage } from '@/utils/errors';
import { parsePositiveInteger } from '@/utils/numbers';

export default function NewItemScreen() {
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const requestedVehicleId = params.vehicleId ? parsePositiveInteger(params.vehicleId) : null;
  const repositories = useMemo(() => getRepositories(), []);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const vehicles = repositories.vehicles.list();
      const selected =
        vehicles.find((entry) => entry.id === requestedVehicleId) ?? vehicles[0] ?? null;

      setVehicle(selected);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [repositories, requestedVehicleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSubmit = async (output: ItemFormOutput) => {
    if (!vehicle) {
      throw new Error('Cadastre um veículo antes de criar um item.');
    }

    repositories.maintenanceItems.create({
      vehicleId: vehicle.id,
      ...output,
    });
    void refreshScheduledNotifications();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Novo item' }} />
      {loading ? (
        <LoadingState message="Carregando veículo..." />
      ) : error ? (
        <EmptyState
          actionLabel="Voltar"
          description={error}
          onAction={() => router.back()}
          title="Não foi possível abrir o formulário"
        />
      ) : vehicle ? (
        <ItemForm
          key={vehicle.id}
          onSubmit={handleSubmit}
          submitLabel="Criar item"
          vehicle={vehicle}
        />
      ) : (
        <EmptyState
          actionLabel="Cadastrar veículo"
          description="Você precisa de um veículo para adicionar itens de manutenção."
          onAction={() => router.push('/vehicles/new')}
          title="Nenhum veículo cadastrado"
        />
      )}
    </Screen>
  );
}
