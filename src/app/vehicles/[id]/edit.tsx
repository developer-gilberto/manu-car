import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import type { Vehicle } from '@/data/db/schema';
import { getRepositories } from '@/data/repositories';
import { VehicleForm, type VehicleFormOutput } from '@/forms/vehicle-form';
import { getErrorMessage } from '@/utils/errors';
import { parsePositiveInteger } from '@/utils/numbers';

export default function EditVehicleScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const vehicleId = params.id ? parsePositiveInteger(params.id) : null;
  const repositories = useMemo(() => getRepositories(), []);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      if (vehicleId === null) {
        throw new Error('Veículo inválido.');
      }

      const found = repositories.vehicles.getById(vehicleId);

      if (!found) {
        throw new Error('Veículo não encontrado.');
      }

      setVehicle(found);
    } catch (loadError) {
      setVehicle(null);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [repositories, vehicleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSubmit = async (output: VehicleFormOutput) => {
    if (!vehicle) {
      return;
    }

    repositories.vehicles.update(vehicle.id, output);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Editar veículo' }} />
      {loading ? (
        <LoadingState message="Carregando veículo..." />
      ) : error || !vehicle ? (
        <EmptyState
          actionLabel="Voltar"
          description={error ?? 'Não foi possível carregar este veículo.'}
          onAction={() => router.back()}
          title="Veículo indisponível"
        />
      ) : (
        <VehicleForm onSubmit={handleSubmit} submitLabel="Salvar alterações" vehicle={vehicle} />
      )}
    </Screen>
  );
}
