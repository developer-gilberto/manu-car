import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { SwitchField } from '@/components/ui/switch-field';
import { TextField } from '@/components/ui/text-field';
import type { MaintenanceItem, Vehicle } from '@/data/db/schema';
import { createItemFormSchema, type ItemFormValues } from '@/forms/schemas';
import { type Palette, spacing, useThemedStyles } from '@/theme';
import { formatDateInput, parseDateInput } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import { parseNonNegativeInteger, parsePositiveInteger } from '@/utils/numbers';

export interface ItemFormOutput {
  name: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastDoneKm: number | null;
  lastDoneAt: string | null;
  notifyEnabled: boolean;
}

interface ItemFormProps {
  vehicle: Vehicle;
  item?: MaintenanceItem;
  submitLabel: string;
  onSubmit: (output: ItemFormOutput) => Promise<void>;
}

function getDefaultValues(item?: MaintenanceItem): ItemFormValues {
  return {
    name: item?.name ?? '',
    intervalKm: item?.intervalKm?.toString() ?? '',
    intervalMonths: item?.intervalMonths?.toString() ?? '',
    lastDoneKm: item?.lastDoneKm?.toString() ?? '',
    lastDoneAt: item?.lastDoneAt ? formatDateInput(item.lastDoneAt) : '',
    notifyEnabled: item?.notifyEnabled ?? true,
  };
}

export function ItemForm({ vehicle, item, submitLabel, onSubmit }: ItemFormProps) {
  const styles = useThemedStyles(createStyles);
  const schema = useMemo(() => createItemFormSchema(vehicle.odometerKm), [vehicle.odometerKm]);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    defaultValues: getDefaultValues(item),
    resolver: zodResolver(schema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        name: values.name.trim(),
        intervalKm: values.intervalKm === '' ? null : parsePositiveInteger(values.intervalKm),
        intervalMonths:
          values.intervalMonths === '' ? null : parsePositiveInteger(values.intervalMonths),
        lastDoneKm: values.lastDoneKm === '' ? null : parseNonNegativeInteger(values.lastDoneKm),
        lastDoneAt: values.lastDoneAt === '' ? null : parseDateInput(values.lastDoneAt),
        notifyEnabled: values.notifyEnabled,
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
            autoCapitalize="sentences"
            error={errors.name?.message}
            label="Nome do item"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Ex.: troca de óleo"
            value={field.value}
          />
        )}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intervalos</Text>
        <Text style={styles.sectionDescription}>
          Preencha ao menos um intervalo. Os valores padrão são genéricos e o manual do carro
          prevalece.
        </Text>
        <Controller
          control={control}
          name="intervalKm"
          render={({ field }) => (
            <TextField
              error={errors.intervalKm?.message}
              hint="Opcional. Ex.: 10000."
              keyboardType="number-pad"
              label="Intervalo em km"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="10000"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="intervalMonths"
          render={({ field }) => (
            <TextField
              error={errors.intervalMonths?.message}
              hint="Opcional. Ex.: 6."
              keyboardType="number-pad"
              label="Intervalo em meses"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="6"
              value={field.value}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Última manutenção</Text>
        <Text style={styles.sectionDescription}>
          Se ainda não fez, deixe em branco para contar a partir do odômetro atual.
        </Text>
        <Controller
          control={control}
          name="lastDoneKm"
          render={({ field }) => (
            <TextField
              error={errors.lastDoneKm?.message}
              hint={`Odômetro atual: ${vehicle.odometerKm} km.`}
              keyboardType="number-pad"
              label="Km da última manutenção"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Ex.: 45000"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="lastDoneAt"
          render={({ field }) => (
            <TextField
              autoCorrect={false}
              error={errors.lastDoneAt?.message}
              hint="Opcional. Formato DD/MM/AAAA."
              label="Data da última manutenção"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="01/09/2026"
              value={field.value}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="notifyEnabled"
        render={({ field }) => (
          <SwitchField
            description="Os lembretes automáticos entram em uma próxima fase."
            label="Lembrar deste item"
            onValueChange={field.onChange}
            value={field.value}
          />
        )}
      />

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

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      gap: spacing.lg,
    },
    section: {
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    sectionDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
  });
