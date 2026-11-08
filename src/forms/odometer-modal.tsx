import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { TextField } from '@/components/ui/text-field';
import type { Vehicle } from '@/data/db/schema';
import { createOdometerFormSchema, type OdometerFormValues } from '@/forms/schemas';
import { colors } from '@/theme';
import { formatDate, formatKm, parseDateInput, todayDateInput } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import { parseNonNegativeInteger } from '@/utils/numbers';

export interface OdometerFormOutput {
  km: number;
  readAt: string;
}

interface OdometerModalProps {
  vehicle: Vehicle;
  visible: boolean;
  onClose: () => void;
  onSubmit: (output: OdometerFormOutput) => Promise<void>;
}

export function OdometerModal({ vehicle, visible, onClose, onSubmit }: OdometerModalProps) {
  const schema = useMemo(() => createOdometerFormSchema(vehicle.odometerKm), [vehicle.odometerKm]);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OdometerFormValues>({
    defaultValues: {
      km: String(vehicle.odometerKm),
      date: todayDateInput(),
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (visible) {
      reset({
        km: String(vehicle.odometerKm),
        date: todayDateInput(),
      });
    }
  }, [reset, vehicle.odometerKm, visible]);

  const submit = handleSubmit(async (values) => {
    const km = parseNonNegativeInteger(values.km);
    const readAt = parseDateInput(values.date);

    if (km === null || !readAt) {
      setError('root', { message: 'Confira os dados informados.' });
      return;
    }

    try {
      await onSubmit({ km, readAt });
      onClose();
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <ModalSheet onClose={onClose} title="Atualizar odômetro" visible={visible}>
      <Text style={styles.current}>
        Odômetro atual: {formatKm(vehicle.odometerKm)} em {formatDate(vehicle.odometerUpdatedAt)}
      </Text>
      <FormError message={errors.root?.message} />
      <Controller
        control={control}
        name="km"
        render={({ field }) => (
          <TextField
            error={errors.km?.message}
            keyboardType="number-pad"
            label="Quilometragem"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Ex.: 52000"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <TextField
            autoCorrect={false}
            error={errors.date?.message}
            hint="Formato DD/MM/AAAA."
            label="Data da leitura"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="08/11/2026"
            value={field.value}
          />
        )}
      />
      <Button
        loading={isSubmitting}
        onPress={() => {
          void submit();
        }}
        title="Salvar odômetro"
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  current: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
