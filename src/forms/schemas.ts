import { z } from 'zod';

import { parseCurrencyToCents } from '@/utils/currency';
import { formatKm, isFutureDateInput, parseDateInput } from '@/utils/date';
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
    const intervalKm = values.intervalKm === '' ? null : parsePositiveInteger(values.intervalKm);
    const intervalMonths =
      values.intervalMonths === '' ? null : parsePositiveInteger(values.intervalMonths);

    if (values.intervalKm !== '' && intervalKm === null) {
      addIssue(ctx, 'intervalKm', 'Informe um número inteiro maior que zero.');
    }

    if (values.intervalMonths !== '' && intervalMonths === null) {
      addIssue(ctx, 'intervalMonths', 'Informe um número inteiro maior que zero.');
    }

    if (intervalKm === null && intervalMonths === null) {
      addIssue(ctx, 'intervalKm', 'Informe ao menos um intervalo em km ou em meses.');
    }

    const lastDoneKm = values.lastDoneKm === '' ? null : parseNonNegativeInteger(values.lastDoneKm);

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

export function createOdometerFormSchema(currentKm: number) {
  return z.object({
    km: z
      .string()
      .trim()
      .min(1, 'Informe a quilometragem.')
      .superRefine((value, ctx) => {
        const parsed = parseNonNegativeInteger(value);

        if (parsed === null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Informe um número inteiro maior ou igual a zero.',
          });
        } else if (parsed < currentKm) {
          ctx.addIssue({
            code: 'custom',
            message: `O odômetro não pode ser menor que o atual (${formatKm(currentKm)}).`,
          });
        }
      }),
    date: z
      .string()
      .trim()
      .min(1, 'Informe a data.')
      .superRefine((value, ctx) => {
        if (!parseDateInput(value)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Use o formato DD/MM/AAAA.',
          });
        } else if (isFutureDateInput(value)) {
          ctx.addIssue({
            code: 'custom',
            message: 'A data não pode estar no futuro.',
          });
        }
      }),
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
        const parsed = parseNonNegativeInteger(value);

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
