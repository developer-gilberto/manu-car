import type { VehicleSnapshot } from '@/domain';

import {
  buildMaintenanceItemView,
  getDueSummary,
  getEstimatedLabel,
  sortMaintenanceViews,
  statusLabel,
} from '@/utils/maintenance-view';
import type { MaintenanceItemViewItem } from '@/utils/maintenance-view';

const NOW = '2026-11-08T12:00:00.000Z';

const vehicle: VehicleSnapshot = {
  odometerKm: 10000,
  odometerUpdatedAt: '2026-01-01T12:00:00.000Z',
};

function item(overrides: Partial<MaintenanceItemViewItem> = {}): MaintenanceItemViewItem {
  return {
    id: 1,
    name: 'Óleo do motor',
    archived: false,
    intervalKm: 1000,
    intervalMonths: null,
    lastDoneKm: 9000,
    lastDoneAt: null,
    ...overrides,
  };
}

describe('maintenance view utils', () => {
  it('builds a view for a due item', () => {
    const view = buildMaintenanceItemView(item(), vehicle, 20, NOW);

    expect(view.status).toBe('vencido');
    expect(view.dueKm).toBe(10000);
    expect(view.remainingKm).toBe(0);
    expect(view.error).toBeNull();
    expect(getDueSummary(view)).toContain('Venceu por km');
  });

  it('builds a view for an item due soon', () => {
    const view = buildMaintenanceItemView(item({ lastDoneKm: 9100 }), vehicle, 20, NOW);

    expect(view.status).toBe('atencao');
    expect(view.remainingKm).toBe(100);
    expect(getDueSummary(view)).toContain('Faltam 100 km');
  });

  it('builds a view for an item in good standing', () => {
    const view = buildMaintenanceItemView(
      item({ intervalKm: 5000, lastDoneKm: 8000 }),
      vehicle,
      20,
      NOW,
    );

    expect(view.status).toBe('ok');
    expect(view.remainingKm).toBe(3000);
    expect(getDueSummary(view)).toContain('Faltam 3.000 km');
  });

  it('includes date based due information', () => {
    const view = buildMaintenanceItemView(
      item({
        intervalKm: null,
        intervalMonths: 6,
        lastDoneKm: null,
        lastDoneAt: '2026-09-01T12:00:00.000Z',
      }),
      vehicle,
      20,
      NOW,
    );

    expect(view.dueAt).toBe('2027-03-01T12:00:00.000Z');
    expect(view.remainingDays).toBe(113);
    expect(getDueSummary(view)).toContain('Faltam 113 dias');
  });

  it('estimates the due date from the average', () => {
    const view = buildMaintenanceItemView(
      item({ intervalKm: 5000, lastDoneKm: 8000 }),
      vehicle,
      20,
      NOW,
    );

    expect(view.estimatedDueAt).not.toBeNull();
    expect(getEstimatedLabel(view)).toContain('Previsão por km:');
  });

  it('returns an error view when the odometer decreased', () => {
    const view = buildMaintenanceItemView(item({ lastDoneKm: 11000 }), vehicle, 20, NOW);

    expect(view.status).toBe('atencao');
    expect(view.error).toContain('Odômetro diminuiu');
    expect(getDueSummary(view)).toEqual([view.error]);
    expect(getEstimatedLabel(view)).toBeNull();
  });

  it('sorts by status and then due date', () => {
    const overdue = buildMaintenanceItemView(item({ id: 1 }), vehicle, 20, NOW);
    const soon = buildMaintenanceItemView(item({ id: 2, lastDoneKm: 9100 }), vehicle, 20, NOW);
    const ok = buildMaintenanceItemView(
      item({ id: 3, intervalKm: 5000, lastDoneKm: 8000 }),
      vehicle,
      20,
      NOW,
    );

    expect(sortMaintenanceViews([ok, overdue, soon]).map((view) => view.item.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it('labels statuses in pt-BR', () => {
    expect(statusLabel('ok')).toBe('Em dia');
    expect(statusLabel('atencao')).toBe('Atenção');
    expect(statusLabel('vencido')).toBe('Vencido');
  });
});
