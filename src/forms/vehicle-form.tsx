import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import type { Vehicle } from '@/data/db/schema';
import { vehicleFormSchema, type VehicleFormValues } from '@/forms/schemas';
import { colors, spacing } from '@/theme';
import { getErrorMessage } from '@/utils/errors';

export interface VehicleFormOutput {
  name: string;
  plate: string | null;
}

interface VehicleFormProps {
  vehicle?: Vehicle;
  submitLabel: string;
  onSubmit: (output: VehicleFormOutput) => Promise<void>;
}

export function VehicleForm({ vehicle, submitLabel, onSubmit }: VehicleFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    defaultValues: {
      name: vehicle?.name ?? '',
      plate: vehicle?.plate ?? '',
    },
    resolver: zodResolver(vehicleFormSchema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name.trim(),
        plate: values.plate.trim() === '' ? null : values.plate.trim(),
      });
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <View style={styles.container}>
      <FormError message={errors.root?.message} />
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            autoCapitalize="words"
            error={errors.name?.message}
            label="Nome do veículo"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Ex.: Onix da família"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="plate"
        render={({ field }) => (
          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.plate?.message}
            hint="Opcional."
            label="Placa"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="ABC1D23"
            value={field.value}
          />
        )}
      />
      <Text style={styles.note}>
        A quilometragem inicial é 0 km. Atualize o odômetro pela Home.
      </Text>
      <Button
        loading={isSubmitting}
        onPress={() => {
          void submit();
        }}
        title={submitLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
