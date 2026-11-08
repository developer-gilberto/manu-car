import { createTestDatabase } from '@/data/db/testing/test-database';
import type { AppDatabase } from '@/data/db/types';
import { MaintenanceItemRepository } from '@/data/repositories/maintenance-item-repository';
import { VehicleRepository } from '@/data/repositories/vehicle-repository';

const LAST_DONE_AT = '2026-02-01T09:30:00.000Z';

describe('MaintenanceItemRepository', () => {
  let db: AppDatabase;
  let vehicleId: number;
  let repository: MaintenanceItemRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    vehicleId = new VehicleRepository(db).create({ name: 'Gol' }).id;
    repository = new MaintenanceItemRepository(db);
  });

  it('cria um item com valores padrão', () => {
    const item = repository.create({ vehicleId, name: 'Pneus' });

    expect(item.id).toBeGreaterThan(0);
    expect(item.vehicleId).toBe(vehicleId);
    expect(item.name).toBe('Pneus');
    expect(item.intervalKm).toBeNull();
    expect(item.intervalMonths).toBeNull();
    expect(item.lastDoneKm).toBeNull();
    expect(item.lastDoneAt).toBeNull();
    expect(item.notifyEnabled).toBe(true);
    expect(item.archived).toBe(false);
  });

  it('lista os itens do veículo incluindo os do seed', () => {
    const item = repository.create({ vehicleId, name: 'Pneus' });
    const items = repository.listByVehicle(vehicleId);

    expect(items).toHaveLength(14);
    expect(items.at(-1)).toEqual(item);
  });

  it('busca um item por id', () => {
    const item = repository.create({ vehicleId, name: 'Pneus' });

    expect(repository.getById(item.id)).toEqual(item);
    expect(repository.getById(9999)).toBeUndefined();
  });

  it('atualiza um item', () => {
    const item = repository.create({ vehicleId, name: 'Pneus' });

    const updated = repository.update(item.id, {
      name: 'Pneus dianteiros',
      intervalKm: 10000,
      intervalMonths: 12,
      lastDoneKm: 45000,
      lastDoneAt: LAST_DONE_AT,
      notifyEnabled: false,
      archived: true,
    });

    expect(updated).toMatchObject({
      id: item.id,
      name: 'Pneus dianteiros',
      intervalKm: 10000,
      intervalMonths: 12,
      lastDoneKm: 45000,
      lastDoneAt: LAST_DONE_AT,
      notifyEnabled: false,
      archived: true,
    });
    expect(repository.getById(item.id)).toEqual(updated);
  });

  it('permite limpar campos opcionais', () => {
    const item = repository.create({
      vehicleId,
      name: 'Pneus',
      intervalKm: 10000,
      intervalMonths: 12,
      lastDoneKm: 45000,
      lastDoneAt: LAST_DONE_AT,
    });

    const updated = repository.update(item.id, {
      intervalKm: null,
      intervalMonths: null,
      lastDoneKm: null,
      lastDoneAt: null,
    });

    expect(updated).toMatchObject({
      intervalKm: null,
      intervalMonths: null,
      lastDoneKm: null,
      lastDoneAt: null,
    });
  });

  it('retorna o item atual quando a atualização está vazia', () => {
    const item = repository.create({ vehicleId, name: 'Pneus' });

    expect(repository.update(item.id, {})).toEqual(item);
    expect(repository.update(9999, {})).toBeUndefined();
  });

  it('remove um item', () => {
    const item = repository.create({ vehicleId, name: 'Pneus' });

    expect(repository.delete(item.id)).toBe(true);
    expect(repository.getById(item.id)).toBeUndefined();
    expect(repository.delete(item.id)).toBe(false);
  });
});
