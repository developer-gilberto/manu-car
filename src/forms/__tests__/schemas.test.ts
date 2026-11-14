import {
  createItemFormSchema,
  createMarkDoneFormSchema,
  createOdometerFormSchema,
  vehicleFormSchema,
  weeklyReminderFormSchema,
} from '@/forms/schemas';

describe('vehicle form schema', () => {
  it('requires a name and trims values', () => {
    expect(vehicleFormSchema.safeParse({ name: '', plate: '' }).success).toBe(false);

    const parsed = vehicleFormSchema.safeParse({
      name: '  Onix  ',
      plate: ' ABC1D23 ',
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ name: 'Onix', plate: 'ABC1D23' });
  });
});

describe('item form schema', () => {
  const validValues = {
    name: 'Óleo',
    intervalKm: '10000',
    intervalMonths: '',
    lastDoneKm: '45000',
    lastDoneAt: '01/09/2026',
    notifyEnabled: true,
  };

  it('accepts a valid item', () => {
    const result = createItemFormSchema(50000).safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it('requires at least one interval', () => {
    const result = createItemFormSchema(50000).safeParse({
      ...validValues,
      intervalKm: '',
      intervalMonths: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a last done km above the current odometer', () => {
    const result = createItemFormSchema(50000).safeParse({
      ...validValues,
      lastDoneKm: '60000',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid and future dates', () => {
    expect(
      createItemFormSchema(50000).safeParse({
        ...validValues,
        lastDoneAt: '31/02/2026',
      }).success,
    ).toBe(false);
    expect(
      createItemFormSchema(50000).safeParse({
        ...validValues,
        lastDoneAt: '01/01/2099',
      }).success,
    ).toBe(false);
  });
});

describe('odometer form schema', () => {
  it('accepts the current or a higher odometer', () => {
    expect(
      createOdometerFormSchema(50000).safeParse({
        km: '50000',
        date: '08/11/2026',
      }).success,
    ).toBe(true);
    expect(
      createOdometerFormSchema(50000).safeParse({
        km: '51000',
        date: '08/11/2026',
      }).success,
    ).toBe(true);
  });

  it('rejects a decreased odometer', () => {
    expect(
      createOdometerFormSchema(50000).safeParse({
        km: '49999',
        date: '08/11/2026',
      }).success,
    ).toBe(false);
  });
});

describe('odometer form schema with history', () => {
  const readings = [
    { km: 48000, readAt: '2020-01-15T12:00:00.000Z' },
    { km: 49000, readAt: '2020-02-15T12:00:00.000Z' },
  ];

  it('accepts a consistent retroactive reading', () => {
    expect(
      createOdometerFormSchema(50000, readings).safeParse({
        km: '48500',
        date: '01/02/2020',
      }).success,
    ).toBe(true);
  });

  it('accepts a new latest reading above the current odometer', () => {
    expect(
      createOdometerFormSchema(50000, readings).safeParse({
        km: '50500',
        date: '01/03/2020',
      }).success,
    ).toBe(true);
  });

  it('rejects a retroactive reading above the following reading', () => {
    expect(
      createOdometerFormSchema(50000, readings).safeParse({
        km: '49500',
        date: '01/02/2020',
      }).success,
    ).toBe(false);
  });

  it('rejects a retroactive reading below the previous reading', () => {
    expect(
      createOdometerFormSchema(50000, readings).safeParse({
        km: '47000',
        date: '01/02/2020',
      }).success,
    ).toBe(false);
  });

  it('rejects a retroactive reading above the current odometer', () => {
    expect(
      createOdometerFormSchema(50000, readings).safeParse({
        km: '51000',
        date: '01/02/2020',
      }).success,
    ).toBe(false);
  });

  it('rejects a reading below the current odometer after the last reading', () => {
    expect(
      createOdometerFormSchema(50000, readings).safeParse({
        km: '49500',
        date: '01/03/2020',
      }).success,
    ).toBe(false);
  });
});

describe('mark done form schema', () => {
  const validValues = {
    km: '50000',
    date: '08/11/2026',
    cost: '250,00',
    notes: 'Troca feita',
  };

  it('accepts a valid record', () => {
    expect(
      createMarkDoneFormSchema(50000, 45000, '2026-09-01T12:00:00.000Z').safeParse(validValues)
        .success,
    ).toBe(true);
  });

  it('rejects km above current or below last done', () => {
    expect(
      createMarkDoneFormSchema(50000).safeParse({
        ...validValues,
        km: '51000',
      }).success,
    ).toBe(false);
    expect(
      createMarkDoneFormSchema(50000, 48000).safeParse({
        ...validValues,
        km: '47000',
      }).success,
    ).toBe(false);
  });

  it('rejects dates before the last maintenance', () => {
    expect(
      createMarkDoneFormSchema(50000, 45000, '2026-09-01T12:00:00.000Z').safeParse({
        ...validValues,
        date: '01/08/2026',
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid cost', () => {
    expect(
      createMarkDoneFormSchema(50000).safeParse({
        ...validValues,
        cost: 'abc',
      }).success,
    ).toBe(false);
  });
});

describe('weekly reminder form schema', () => {
  it('accepts a valid weekday and time', () => {
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 2,
        hour: '09',
        minute: '30',
      }).success,
    ).toBe(true);
  });

  it('accepts boundary hours and minutes', () => {
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 7,
        hour: '23',
        minute: '59',
      }).success,
    ).toBe(true);
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 1,
        hour: '0',
        minute: '0',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid weekday', () => {
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 0,
        hour: '09',
        minute: '30',
      }).success,
    ).toBe(false);
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 8,
        hour: '09',
        minute: '30',
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid hour or minute', () => {
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 2,
        hour: '24',
        minute: '30',
      }).success,
    ).toBe(false);
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 2,
        hour: '09',
        minute: '60',
      }).success,
    ).toBe(false);
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 2,
        hour: '',
        minute: '30',
      }).success,
    ).toBe(false);
    expect(
      weeklyReminderFormSchema.safeParse({
        weekday: 2,
        hour: 'abc',
        minute: '30',
      }).success,
    ).toBe(false);
  });
});

describe('input masks with form schemas', () => {
  it('aceita quilometragem formatada com separador de milhar', () => {
    expect(
      createOdometerFormSchema(50000).safeParse({
        km: '50.000',
        date: '08/11/2026',
      }).success,
    ).toBe(true);
    expect(
      createMarkDoneFormSchema(50000).safeParse({
        km: '49.500',
        date: '08/11/2026',
        cost: 'R$ 1.234,56',
        notes: '',
      }).success,
    ).toBe(true);
  });

  it('valida o km formatado pelo mesmo critério do valor puro', () => {
    expect(
      createMarkDoneFormSchema(50000).safeParse({
        km: '51.000',
        date: '08/11/2026',
        cost: '',
        notes: '',
      }).success,
    ).toBe(false);
  });

  it('aceita intervalos e km da última manutenção formatados', () => {
    const result = createItemFormSchema(50000).safeParse({
      name: 'Óleo',
      intervalKm: '10.000',
      intervalMonths: '6',
      lastDoneKm: '45.000',
      lastDoneAt: '01/09/2026',
      notifyEnabled: true,
    });

    expect(result.success).toBe(true);
  });

  it('continua recusando km acima do odômetro quando formatado', () => {
    expect(
      createItemFormSchema(50000).safeParse({
        name: 'Óleo',
        intervalKm: '10.000',
        intervalMonths: '',
        lastDoneKm: '60.000',
        lastDoneAt: '',
        notifyEnabled: true,
      }).success,
    ).toBe(false);
  });
});
