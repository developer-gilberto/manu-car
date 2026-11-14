import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { TextField } from '@/components/ui/text-field';
import type { MaintenanceItem, Vehicle } from '@/data/db/schema';
import { createMarkDoneFormSchema, type MarkDoneFormValues } from '@/forms/schemas';
import { type Palette, spacing, useThemedStyles } from '@/theme';
import { formatKm, parseDateInput, todayDateInput } from '@/utils/date';
import { parseCurrencyToCents } from '@/utils/currency';
import { getErrorMessage } from '@/utils/errors';
import {
  kmToInput,
  maskCurrencyInput,
  maskDateInput,
  maskKmInput,
  unmaskDigits,
} from '@/utils/input-masks';
import { parseNonNegativeInteger } from '@/utils/numbers';

export interface MarkDoneFormOutput {
  doneAt: string;
  km: number;
  costCents: number | null;
  notes: string | null;
}

interface MarkDoneModalProps {
  item: MaintenanceItem;
  vehicle: Vehicle;
  visible: boolean;
  onClose: () => void;
  onSubmit: (output: MarkDoneFormOutput) => Promise<void>;
}

export function MarkDoneModal({ item, vehicle, visible, onClose, onSubmit }: MarkDoneModalProps) {
  const styles = useThemedStyles(createStyles);
  const schema = useMemo(
    () => createMarkDoneFormSchema(vehicle.odometerKm, item.lastDoneKm, item.lastDoneAt),
    [item.lastDoneAt, item.lastDoneKm, vehicle.odometerKm],
  );
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MarkDoneFormValues>({
    defaultValues: {
      km: kmToInput(vehicle.odometerKm),
      date: todayDateInput(),
      cost: '',
      notes: '',
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (visible) {
      reset({
        km: kmToInput(vehicle.odometerKm),
        date: todayDateInput(),
        cost: '',
        notes: '',
      });
    }
  }, [reset, vehicle.odometerKm, visible]);

  const submit = handleSubmit(async (values) => {
    const km = parseNonNegativeInteger(unmaskDigits(values.km));
    const doneAt = parseDateInput(values.date);

    if (km === null || !doneAt) {
      setError('root', { message: 'Confira os dados informados.' });
      return;
    }

    try {
      await onSubmit({
        doneAt,
        km,
        costCents: parseCurrencyToCents(values.cost),
        notes: values.notes.trim() === '' ? null : values.notes.trim(),
      });
      onClose();
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <ModalSheet onClose={onClose} title="Marcar como feito" visible={visible}>
      <Text style={styles.intro}>
        {item.name} · odômetro atual {formatKm(vehicle.odometerKm)}
      </Text>
      <FormError message={errors.root?.message} />
      <Controller
        control={control}
        name="km"
        render={({ field }) => (
          <TextField
            error={errors.km?.message}
            keyboardType="number-pad"
            label="Km da manutenção"
            mask={maskKmInput}
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
            keyboardType="number-pad"
            label="Data da manutenção"
            mask={maskDateInput}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="08/11/2026"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="cost"
        render={({ field }) => (
          <TextField
            error={errors.cost?.message}
            hint="Opcional. Digite os centavos: 25000 vira R$ 250,00."
            keyboardType="number-pad"
            label="Custo"
            mask={maskCurrencyInput}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="R$ 0,00"
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextField
            error={errors.notes?.message}
            label="Observações"
            multiline
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Oficina, peças trocadas, etc."
            value={field.value}
          />
        )}
      />
      <Text style={styles.note}>
        O registro entra no histórico e atualiza a última manutenção deste item.
      </Text>
      <Button
        loading={isSubmitting}
        onPress={() => {
          void submit();
        }}
        title="Registrar manutenção"
      />
    </ModalSheet>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    intro: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    note: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: -spacing.sm,
    },
  });
