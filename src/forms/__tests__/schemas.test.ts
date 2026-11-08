import {
  createItemFormSchema,
  createMarkDoneFormSchema,
  createOdometerFormSchema,
  vehicleFormSchema,
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
