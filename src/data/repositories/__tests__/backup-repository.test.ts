import { createTestDatabase } from '@/data/db/testing/test-database';
import type { AppDatabase } from '@/data/db/types';
import { BackupRepository } from '@/data/repositories/backup-repository';
import { LogRepository } from '@/data/repositories/log-repository';
import { MaintenanceItemRepository } from '@/data/repositories/maintenance-item-repository';
import { OdometerRepository } from '@/data/repositories/odometer-repository';
import { VehicleRepository } from '@/data/repositories/vehicle-repository';
import type { BackupData } from '@/domain/backup';

async function seed(db: AppDatabase): Promise<{ vehicleId: number; itemId: number }> {
  const vehicle = new VehicleRepository(db).create({
    name: 'Gol',
    plate: 'ABC1D23',
    odometerKm: 50_000,
    odometerUpdatedAt: '2026-02-20T10:00:00.000Z',
  });
  const [item] = new MaintenanceItemRepository(db).listByVehicle(vehicle.id);

  if (!item) {
    throw new Error('Seed de itens não encontrado.');
  }

  new OdometerRepository(db).create({
    vehicleId: vehicle.id,
    km: 50_000,
    readAt: '2026-02-20T10:00:00.000Z',
  });
  new LogRepository(db).create({
    itemId: item.id,
    doneAt: '2026-01-10T08:00:00.000Z',
    km: 45_000,
    costCents: 12_990,
    notes: 'Troca feita',
  });

  return { vehicleId: vehicle.id, itemId: item.id };
}

describe('BackupRepository', () => {
  let db: AppDatabase;
  let repository: BackupRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new BackupRepository(db);
  });

  it('exporta todas as tabelas', async () => {
    await seed(db);

    const data = repository.exportData();

    expect(data.vehicles).toHaveLength(1);
    expect(data.maintenanceItems).toHaveLength(13);
    expect(data.odometerReadings).toHaveLength(1);
    expect(data.maintenanceLogs).toHaveLength(1);
  });

  it('restaura após limpar: exportar, apagar tudo e importar devolve o mesmo conteúdo', async () => {
    await seed(db);
    const exported = repository.exportData();

    const fresh = await createTestDatabase();
    const freshRepository = new BackupRepository(fresh);

    freshRepository.replaceAll(exported);

    expect(freshRepository.exportData()).toEqual(exported);
  });

  it('substitui os dados atuais em vez de misturar', async () => {
    await seed(db);
    const backup: BackupData = {
      vehicles: [
        {
          id: 7,
          name: 'Fiesta',
          plate: null,
          odometerKm: 1000,
          odometerUpdatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      odometerReadings: [],
      maintenanceItems: [],
      maintenanceLogs: [],
    };

    repository.replaceAll(backup);

    expect(repository.exportData()).toEqual(backup);
  });

  it('é tudo ou nada: falha no meio desfaz a importação e preserva os dados', async () => {
    const { vehicleId } = await seed(db);
    const before = repository.exportData();

    const broken: BackupData = {
      vehicles: [
        {
          id: 50,
          name: 'Novo',
          plate: null,
          odometerKm: 0,
          odometerUpdatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      odometerReadings: [],
      maintenanceItems: [
        {
          id: 60,
          vehicleId: 50,
          name: 'Óleo',
          intervalKm: null,
          intervalMonths: null,
          lastDoneKm: null,
          lastDoneAt: null,
          notifyEnabled: true,
          archived: false,
        },
      ],
      // Referencia um item que não existe: o insert deve falhar pela FK.
      maintenanceLogs: [
        {
          id: 70,
          itemId: 999,
          doneAt: '2026-01-10T08:00:00.000Z',
          km: 1,
          costCents: null,
          notes: null,
        },
      ],
    };

    expect(() => repository.replaceAll(broken)).toThrow();
    expect(repository.exportData()).toEqual(before);
    expect(before.vehicles.map((vehicle) => vehicle.id)).toContain(vehicleId);
  });
});
