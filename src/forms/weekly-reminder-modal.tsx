import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { TextField } from '@/components/ui/text-field';
import type { WeeklyReminderSchedule } from '@/domain';
import { weeklyReminderFormSchema, type WeeklyReminderFormValues } from '@/forms/schemas';
import { type Palette, radius, spacing, useThemedStyles } from '@/theme';
import { getErrorMessage } from '@/utils/errors';
import { maskTimeUnitInput } from '@/utils/input-masks';
import { parseNonNegativeInteger } from '@/utils/numbers';
import { WEEKDAYS } from '@/utils/weekly-reminder';

interface WeeklyReminderModalProps {
  visible: boolean;
  schedule: WeeklyReminderSchedule;
  onClose: () => void;
  onSubmit: (schedule: WeeklyReminderSchedule) => Promise<void>;
}

function toFormValues(schedule: WeeklyReminderSchedule): WeeklyReminderFormValues {
  return {
    weekday: schedule.weekday,
    hour: String(schedule.hour).padStart(2, '0'),
    minute: String(schedule.minute).padStart(2, '0'),
  };
}

export function WeeklyReminderModal({
  visible,
  schedule,
  onClose,
  onSubmit,
}: WeeklyReminderModalProps) {
  const styles = useThemedStyles(createStyles);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WeeklyReminderFormValues>({
    defaultValues: toFormValues(schedule),
    resolver: zodResolver(weeklyReminderFormSchema),
  });

  useEffect(() => {
    if (visible) {
      reset(toFormValues(schedule));
    }
  }, [reset, schedule, visible]);

  const submit = handleSubmit(async (values) => {
    const hour = parseNonNegativeInteger(values.hour);
    const minute = parseNonNegativeInteger(values.minute);

    if (hour === null || minute === null) {
      setError('root', { message: 'Confira o horário informado.' });
      return;
    }

    try {
      await onSubmit({ weekday: values.weekday, hour, minute });
      onClose();
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <ModalSheet onClose={onClose} title="Lembrete de quilometragem" visible={visible}>
      <Text style={styles.intro}>
        Escolha o dia da semana e o horário em que o ManuCar deve avisar você para atualizar o
        odômetro.
      </Text>
      <FormError message={errors.root?.message} />
      <Controller
        control={control}
        name="weekday"
        render={({ field }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Dia da semana</Text>
            <View style={styles.weekdays}>
              {WEEKDAYS.map((option) => {
                const selected = field.value === option.value;

                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={option.value}
                    onPress={() => field.onChange(option.value)}
                    style={[styles.weekday, selected && styles.weekdaySelected]}
                  >
                    <Text style={[styles.weekdayLabel, selected && styles.weekdayLabelSelected]}>
                      {option.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.weekday?.message ? (
              <Text style={styles.error}>{errors.weekday.message}</Text>
            ) : null}
          </View>
        )}
      />
      <View style={styles.timeRow}>
        <Controller
          control={control}
          name="hour"
          render={({ field }) => (
            <TextField
              containerStyle={styles.timeField}
              error={errors.hour?.message}
              keyboardType="number-pad"
              label="Hora"
              mask={maskTimeUnitInput}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="09"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="minute"
          render={({ field }) => (
            <TextField
              containerStyle={styles.timeField}
              error={errors.minute?.message}
              keyboardType="number-pad"
              label="Minuto"
              mask={maskTimeUnitInput}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="00"
              value={field.value}
            />
          )}
        />
      </View>
      <Text style={styles.hint}>Horário local do aparelho, no formato 24h.</Text>
      <Button
        loading={isSubmitting}
        onPress={() => {
          void submit();
        }}
        title="Salvar lembrete"
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
    field: {
      gap: spacing.xs,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    weekdays: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    weekday: {
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: radius.full,
      borderWidth: 1,
      minWidth: 40,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    weekdaySelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    weekdayLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    weekdayLabelSelected: {
      color: colors.white,
    },
    timeRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    timeField: {
      flex: 1,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 16,
      marginTop: -spacing.sm,
    },
    error: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '600',
    },
  });
