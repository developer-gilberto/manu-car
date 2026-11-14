import { z } from 'zod';

import { assertOdometerReadingFits, OdometerDecreasedError } from '@/domain';
import type { OdometerReadingSnapshot } from '@/domain';
import { parseCurrencyToCents } from '@/utils/currency';
import { formatKm, isFutureDateInput, parseDateInput } from '@/utils/date';
import { unmaskDigits } from '@/utils/input-masks';
import { parseNonNegativeInteger, parsePositiveInteger } from '@/utils/numbers';

function addIssue(ctx: z.RefinementCtx, path: string, message: string): void {
  ctx.addIssue({
    code: 'custom',
    message,
    path: [path],
  });
}

export const vehicleFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do veículo.').max(60, 'Use até 60 caracteres.'),
  plate: z.string().trim().max(10, 'Use até 10 caracteres.'),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const weeklyReminderFormSchema = z.object({
  weekday: z
    .number()
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 7,
      'Escolha um dia da semana.',
    ),
  hour: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const parsed = parseNonNegativeInteger(value);

      if (parsed === null || parsed > 23) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe uma hora entre 0 e 23.',
        });
      }
    }),
  minute: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const parsed = parseNonNegativeInteger(value);

      if (parsed === null || parsed > 59) {
        ctx.addIssue({
          code: 'custom',
          message: 'Informe um minuto entre 0 e 59.',
        });
      }
    }),
});

export type WeeklyReminderFormValues = z.infer<typeof weeklyReminderFormSchema>;

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do item.').max(80, 'Use até 80 caracteres.'),
  intervalKm: z.string().trim(),
  intervalMonths: z.string().trim(),
  lastDoneKm: z.string().trim(),
  lastDoneAt: z.string().trim(),
  notifyEnabled: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export function createItemFormSchema(vehicleOdometerKm: number) {
  return itemFormSchema.superRefine((values, ctx) => {
    const intervalKm =
      values.intervalKm === '' ? null : parsePositiveInteger(unmaskDigits(values.intervalKm));
    const intervalMonths =
      values.intervalMonths === ''
        ? null
        : parsePositiveInteger(unmaskDigits(values.intervalMonths));

    if (values.intervalKm !== '' && intervalKm === null) {
      addIssue(ctx, 'intervalKm', 'Informe um número inteiro maior que zero.');
    }

    if (values.intervalMonths !== '' && intervalMonths === null) {
      addIssue(ctx, 'intervalMonths', 'Informe um número inteiro maior que zero.');
    }

    if (intervalKm === null && intervalMonths === null) {
      addIssue(ctx, 'intervalKm', 'Informe ao menos um intervalo em km ou em meses.');
    }

    const lastDoneKm =
      values.lastDoneKm === '' ? null : parseNonNegativeInteger(unmaskDigits(values.lastDoneKm));

    if (values.lastDoneKm !== '' && lastDoneKm === null) {
      addIssue(ctx, 'lastDoneKm', 'Informe um número inteiro maior ou igual a zero.');
    } else if (lastDoneKm !== null && lastDoneKm > vehicleOdometerKm) {
      addIssue(
        ctx,
        'lastDoneKm',
        `Não pode ser maior que o odômetro atual (${formatKm(vehicleOdometerKm)}).`,
      );
    }

    if (values.lastDoneAt !== '') {
      const parsedDate = parseDateInput(values.lastDoneAt);

      if (!parsedDate) {
        addIssue(ctx, 'lastDoneAt', 'Use o formato DD/MM/AAAA.');
      } else if (isFutureDateInput(values.lastDoneAt)) {
        addIssue(ctx, 'lastDoneAt', 'A data não pode estar no futuro.');
      }
    }
  });
}

export function createOdometerFormSchema(
  currentKm: number,
  readings: readonly OdometerReadingSnapshot[] = [],
) {
  return z
    .object({
      km: z.string().trim(),
      date: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      const km = values.km === '' ? null : parseNonNegativeInteger(unmaskDigits(values.km));

      if (values.km === '') {
        addIssue(ctx, 'km', 'Informe a quilometragem.');
      } else if (km === null) {
        addIssue(ctx, 'km', 'Informe um número inteiro maior ou igual a zero.');
      }

      const parsedDate = values.date === '' ? null : parseDateInput(values.date);
      const futureDate = values.date !== '' && isFutureDateInput(values.date);

      if (values.date === '') {
        addIssue(ctx, 'date', 'Informe a data.');
      } else if (!parsedDate) {
        addIssue(ctx, 'date', 'Use o formato DD/MM/AAAA.');
      } else if (futureDate) {
        addIssue(ctx, 'date', 'A data não pode estar no futuro.');
      }

      if (km === null || !parsedDate || futureDate) {
        return;
      }

      const latest = readings.reduce<OdometerReadingSnapshot | null>((latestReading, reading) => {
        if (latestReading === null) {
          return reading;
        }

        return new Date(reading.readAt).getTime() > new Date(latestReading.readAt).getTime()
          ? reading
          : latestReading;
      }, null);
      const latestTime = latest === null ? null : new Date(latest.readAt).getTime();
      const isRetroactive = latestTime !== null && new Date(parsedDate).getTime() < latestTime;

      if (!isRetroactive) {
        const minimumKm = Math.max(currentKm, latest?.km ?? 0);

        if (km < minimumKm) {
          addIssue(
            ctx,
            'km',
            `O odômetro não pode ser menor que o atual (${formatKm(minimumKm)}).`,
          );
          return;
        }
      } else if (km > currentKm) {
        addIssue(
          ctx,
          'km',
          `Uma leitura com data anterior não pode ser maior que o odômetro atual (${formatKm(currentKm)}).`,
        );
        return;
      }

      try {
        assertOdometerReadingFits(readings, { km, readAt: parsedDate });
      } catch (error) {
        if (error instanceof OdometerDecreasedError) {
          addIssue(
            ctx,
            'km',
            `A leitura é incompatível com as leituras vizinhas: o odômetro diminuiria de ${formatKm(
              error.previousKm,
            )} para ${formatKm(error.currentKm)}.`,
          );
        } else {
          addIssue(ctx, 'km', 'Não foi possível validar a leitura com o histórico.');
        }
      }
    });
}

export type OdometerFormValues = z.infer<ReturnType<typeof createOdometerFormSchema>>;

export function createMarkDoneFormSchema(
  currentKm: number,
  lastDoneKm: number | null = null,
  lastDoneAt: string | null = null,
) {
  return z.object({
    km: z
      .string()
      .trim()
      .min(1, 'Informe a quilometragem.')
      .superRefine((value, ctx) => {
        const parsed = parseNonNegativeInteger(unmaskDigits(value));

        if (parsed === null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Informe um número inteiro maior ou igual a zero.',
          });
        } else if (parsed > currentKm) {
          ctx.addIssue({
            code: 'custom',
            message: `A quilometragem não pode ser maior que o odômetro atual (${formatKm(currentKm)}).`,
          });
        } else if (lastDoneKm !== null && parsed < lastDoneKm) {
          ctx.addIssue({
            code: 'custom',
            message: `A quilometragem não pode ser menor que a última manutenção (${formatKm(lastDoneKm)}).`,
          });
        }
      }),
    date: z
      .string()
      .trim()
      .min(1, 'Informe a data.')
      .superRefine((value, ctx) => {
        const parsed = parseDateInput(value);

        if (!parsed) {
          ctx.addIssue({
            code: 'custom',
            message: 'Use o formato DD/MM/AAAA.',
          });
        } else if (isFutureDateInput(value)) {
          ctx.addIssue({
            code: 'custom',
            message: 'A data não pode estar no futuro.',
          });
        } else if (lastDoneAt && parsed < lastDoneAt) {
          ctx.addIssue({
            code: 'custom',
            message: 'A data não pode ser anterior à última manutenção.',
          });
        }
      }),
    cost: z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        if (value !== '' && parseCurrencyToCents(value) === null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Informe um valor válido, como 123,45.',
          });
        }
      }),
    notes: z.string().trim().max(500, 'Use até 500 caracteres.'),
  });
}

export type MarkDoneFormValues = z.infer<ReturnType<typeof createMarkDoneFormSchema>>;
