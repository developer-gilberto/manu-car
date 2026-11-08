import { createTestDatabase } from '@/data/db/testing/test-database';
import type { AppDatabase } from '@/data/db/types';
import { OdometerRepository } from '@/data/repositories/odometer-repository';
import { VehicleRepository } from '@/data/repositories/vehicle-repository';

const OLDER = '2026-01-01T10:00:00.000Z';
const MIDDLE = '2026-02-01T10:00:00.000Z';
const NEWER = '2026-03-01T10:00:00.000Z';

describe('OdometerRepository', () => {
  let db: AppDatabase;
  let vehicleId: number;
  let repository: OdometerRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    vehicleId = new VehicleRepository(db).create({ name: 'Gol' }).id;
    repository = new OdometerRepository(db);
  });

  it('registra uma leitura', () => {
    const reading = repository.create({ vehicleId, km: 45000, readAt: MIDDLE });

    expect(reading.id).toBeGreaterThan(0);
    expect(reading).toMatchObject({ vehicleId, km: 45000, readAt: MIDDLE });
  });

  it('lista as leituras da mais recente para a mais antiga', () => {
    const middle = repository.create({ vehicleId, km: 45000, readAt: MIDDLE });
    const older = repository.create({ vehicleId, km: 44000, readAt: OLDER });
    const newer = repository.create({ vehicleId, km: 46000, readAt: NEWER });

    expect(repository.listByVehicle(vehicleId).map((reading) => reading.id)).toEqual([
      newer.id,
      middle.id,
      older.id,
    ]);
  });

  it('retorna a leitura mais recente do veículo', () => {
    repository.create({ vehicleId, km: 45000, readAt: MIDDLE });
    const newer = repository.create({ vehicleId, km: 46000, readAt: NEWER });

    expect(repository.latestForVehicle(vehicleId)).toEqual(newer);
    expect(repository.latestForVehicle(9999)).toBeUndefined();
  });

  it('busca uma leitura por id', () => {
    const reading = repository.create({ vehicleId, km: 45000, readAt: MIDDLE });

    expect(repository.getById(reading.id)).toEqual(reading);
    expect(repository.getById(9999)).toBeUndefined();
  });

  it('atualiza uma leitura', () => {
    const reading = repository.create({ vehicleId, km: 45000, readAt: MIDDLE });

    const updated = repository.update(reading.id, { km: 45500, readAt: NEWER });

    expect(updated).toMatchObject({ id: reading.id, km: 45500, readAt: NEWER });
    expect(repository.getById(reading.id)).toEqual(updated);
  });

  it('retorna a leitura atual quando a atualização está vazia', () => {
    const reading = repository.create({ vehicleId, km: 45000, readAt: MIDDLE });

    expect(repository.update(reading.id, {})).toEqual(reading);
    expect(repository.update(9999, {})).toBeUndefined();
  });

  it('remove uma leitura', () => {
    const reading = repository.create({ vehicleId, km: 45000, readAt: MIDDLE });

    expect(repository.delete(reading.id)).toBe(true);
    expect(repository.getById(reading.id)).toBeUndefined();
    expect(repository.delete(reading.id)).toBe(false);
  });
});
