import {
  buildNotificationPlan,
  createWeeklyOdometerNotification,
  InvalidDateError,
} from '@/domain';
import type {
  MaintenanceNotificationPlanEntry,
  NotificationMaintenanceItem,
  NotificationPlanEntry,
  NotificationVehicle,
} from '@/domain';

const NOW = '2026-01-20T12:00:00.000Z';
const vehicle: NotificationVehicle = {
  id: 1,
  name: 'Gol',
  odometerKm: 50_000,
  odometerUpdatedAt: '2026-01-15T12:00:00.000Z',
};

function makeItem(
  overrides: Partial<NotificationMaintenanceItem> = {},
): NotificationMaintenanceItem {
  return {
    id: 1,
    name: 'Óleo do motor',
    intervalKm: 10_000,
    intervalMonths: null,
    lastDoneKm: 45_000,
    lastDoneAt: null,
    notifyEnabled: true,
    archived: false,
    ...overrides,
  };
}

function maintenanceEntries(
  plan: readonly NotificationPlanEntry[],
): MaintenanceNotificationPlanEntry[] {
  return plan.filter(
    (entry): entry is MaintenanceNotificationPlanEntry => entry.type === 'maintenance',
  );
}

describe('buildNotificationPlan', () => {
  it('escolhe a data mais próxima entre vencimento e estimativa por km', () => {
    const plan = buildNotificationPlan(
      [
        makeItem({
          intervalMonths: 2,
          lastDoneAt: '2026-01-15T12:00:00.000Z',
        }),
      ],
      vehicle,
      NOW,
      { avgKmPerDay: 100, includeWeeklyReminder: false },
    );

    expect(maintenanceEntries(plan)).toEqual([
      expect.objectContaining({
        type: 'maintenance',
        key: 'maintenance:1:1',
        vehicleId: 1,
        itemId: 1,
        scheduledDate: '2026-03-06',
        estimated: true,
        overdue: false,
        status: 'ok',
      }),
    ]);
  });

  it('usa a data de vencimento quando ela é anterior à estimativa', () => {
    const plan = buildNotificationPlan(
      [
        makeItem({
          intervalMonths: 1,
          lastDoneAt: '2026-01-15T12:00:00.000Z',
        }),
      ],
      vehicle,
      NOW,
      { avgKmPerDay: 10, includeWeeklyReminder: false },
    );
    const [entry] = maintenanceEntries(plan);

    expect(entry).toMatchObject({
      scheduledDate: '2026-02-15',
      estimated: false,
      body: 'Gol: Óleo do motor vence em 15/02/2026.',
    });
  });

  it('agenda itens apenas por tempo mesmo sem média de km', () => {
    const plan = buildNotificationPlan(
      [
        makeItem({
          intervalKm: null,
          intervalMonths: 1,
          lastDoneKm: null,
          lastDoneAt: '2026-01-15T12:00:00.000Z',
        }),
      ],
      vehicle,
      NOW,
      { includeWeeklyReminder: false },
    );

    expect(maintenanceEntries(plan)).toEqual([
      expect.objectContaining({
        scheduledDate: '2026-02-15',
        estimated: false,
        overdue: false,
      }),
    ]);
  });

  it('usa a estimativa por km quando o item não tem vencimento por data', () => {
    const plan = buildNotificationPlan([makeItem()], vehicle, NOW, {
      avgKmPerDay: 100,
      includeWeeklyReminder: false,
    });

    expect(maintenanceEntries(plan)).toEqual([
      expect.objectContaining({
        scheduledDate: '2026-03-06',
        estimated: true,
        body: 'Gol: Óleo do motor tem previsão por km para 06/03/2026.',
      }),
    ]);
  });

  it('marca itens vencidos e prepara o texto de urgência', () => {
    const plan = buildNotificationPlan(
      [
        makeItem({
          intervalKm: null,
          intervalMonths: 1,
          lastDoneKm: null,
          lastDoneAt: '2026-01-15T12:00:00.000Z',
        }),
      ],
      vehicle,
      '2026-04-01T12:00:00.000Z',
      { includeWeeklyReminder: false },
    );

    expect(maintenanceEntries(plan)).toEqual([
      expect.objectContaining({
        scheduledDate: '2026-02-15',
        overdue: true,
        status: 'vencido',
        title: 'Manutenção vencida: Óleo do motor',
      }),
    ]);
  });

  it('ignora itens arquivados, desativados ou sem intervalos', () => {
    const plan = buildNotificationPlan(
      [
        makeItem({ id: 1, archived: true }),
        makeItem({ id: 2, notifyEnabled: false }),
        makeItem({ id: 3, intervalKm: null, intervalMonths: null }),
      ],
      vehicle,
      NOW,
      { includeWeeklyReminder: false },
    );

    expect(plan).toEqual([]);
  });

  it('ignora um item inválido sem derrubar o restante do plano', () => {
    const plan = buildNotificationPlan(
      [
        makeItem({ id: 1, lastDoneKm: 60_000 }),
        makeItem({
          id: 2,
          intervalKm: null,
          intervalMonths: 1,
          lastDoneAt: '2026-01-15T12:00:00.000Z',
        }),
      ],
      vehicle,
      NOW,
      { includeWeeklyReminder: false },
    );

    expect(maintenanceEntries(plan)).toEqual([
      expect.objectContaining({
        itemId: 2,
        scheduledDate: '2026-02-15',
      }),
    ]);
  });

  it('inclui o lembrete semanal de odômetro por padrão', () => {
    expect(buildNotificationPlan([], vehicle, NOW)).toEqual([createWeeklyOdometerNotification()]);
    expect(createWeeklyOdometerNotification()).toMatchObject({
      type: 'weekly-odometer',
      key: 'weekly-odometer',
      title: 'Atualize a quilometragem do carro',
      weekday: 2,
      hour: 9,
      minute: 0,
    });
  });

  it('rejeita uma data atual inválida', () => {
    expect(() => buildNotificationPlan([], vehicle, 'data-invalida')).toThrow(InvalidDateError);
  });
});
