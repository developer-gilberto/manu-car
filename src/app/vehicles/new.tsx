import { router, Stack } from 'expo-router';
import { useMemo } from 'react';

import { Screen } from '@/components/ui/screen';
import { getRepositories } from '@/data/repositories';
import { VehicleForm, type VehicleFormOutput } from '@/forms/vehicle-form';

export default function NewVehicleScreen() {
  const repositories = useMemo(() => getRepositories(), []);

  const handleSubmit = async (output: VehicleFormOutput) => {
    repositories.vehicles.create(output);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Novo veículo' }} />
      <VehicleForm onSubmit={handleSubmit} submitLabel="Cadastrar veículo" />
    </Screen>
  );
}
