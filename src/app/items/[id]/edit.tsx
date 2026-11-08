import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import type { MaintenanceItem, Vehicle } from '@/data/db/schema';
import { getRepositories } from '@/data/repositories';
import { ItemForm, type ItemFormOutput } from '@/forms/item-form';
import { getErrorMessage } from '@/utils/errors';
import { parsePositiveInteger } from '@/utils/numbers';

interface EditItemData {
  item: MaintenanceItem;
  vehicle: Vehicle;
}

export default function EditItemScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = params.id ? parsePositiveInteger(params.id) : null;
  const repositories = useMemo(() => getRepositories(), []);
  const [data, setData] = useState<EditItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      setData({ item, vehicle });
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

  const handleSubmit = async (output: ItemFormOutput) => {
    if (!data) {
      return;
    }

    repositories.maintenanceItems.update(data.item.id, output);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Editar item' }} />
      {loading ? (
        <LoadingState message="Carregando item..." />
      ) : error || !data ? (
        <EmptyState
          actionLabel="Voltar"
          description={error ?? 'Não foi possível carregar este item.'}
          onAction={() => router.back()}
          title="Item indisponível"
        />
      ) : (
        <ItemForm
          item={data.item}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          vehicle={data.vehicle}
        />
      )}
    </Screen>
  );
}
