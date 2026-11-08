import { DEFAULT_MAINTENANCE_ITEM_NAMES } from '@/data/db/default-maintenance-items';
import { createTestDatabase } from '@/data/db/testing/test-database';
import type { AppDatabase } from '@/data/db/types';
import { LogRepository } from '@/data/repositories/log-repository';
import { MaintenanceItemRepository } from '@/data/repositories/maintenance-item-repository';
import { OdometerRepository } from '@/data/repositories/odometer-repository';
import { VehicleRepository } from '@/data/repositories/vehicle-repository';

const ODOMETER_UPDATED_AT = '2026-01-15T12:00:00.000Z';

describe('VehicleRepository', () => {
  let db: AppDatabase;
  let repository: VehicleRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new VehicleRepository(db);
  });

  it('cria um veículo com valores padrão', () => {
    const vehicle = repository.create({ name: 'Gol' });

    expect(vehicle.id).toBeGreaterThan(0);
    expect(vehicle.name).toBe('Gol');
    expect(vehicle.plate).toBeNull();
    expect(vehicle.odometerKm).toBe(0);
    expect(vehicle.odometerUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('faz o seed dos itens padrão ao criar um veículo', () => {
    const vehicle = repository.create({
      name: 'Gol',
      odometerKm: 45000,
      odometerUpdatedAt: ODOMETER_UPDATED_AT,
    });
    const itemRepository = new MaintenanceItemRepository(db);
    const items = itemRepository.listByVehicle(vehicle.id);

    expect(items).toHaveLength(DEFAULT_MAINTENANCE_ITEM_NAMES.length);
    expect(items.map((item) => item.name)).toEqual([...DEFAULT_MAINTENANCE_ITEM_NAMES]);
    expect(items.every((item) => item.vehicleId === vehicle.id)).toBe(true);
    expect(items.every((item) => item.intervalKm === null)).toBe(true);
    expect(items.every((item) => item.intervalMonths === null)).toBe(true);
    expect(items.every((item) => item.notifyEnabled)).toBe(true);
    expect(items.every((item) => item.archived)).toBe(false);
  });

  it('faz o seed separadamente para cada veículo', () => {
    const first = repository.create({ name: 'Gol' });
    const second = repository.create({ name: 'Onix' });
    const itemRepository = new MaintenanceItemRepository(db);
    const firstItems = itemRepository.listByVehicle(first.id);
    const secondItems = itemRepository.listByVehicle(second.id);

    expect(firstItems).toHaveLength(DEFAULT_MAINTENANCE_ITEM_NAMES.length);
    expect(secondItems).toHaveLength(DEFAULT_MAINTENANCE_ITEM_NAMES.length);

    const firstIds = new Set(firstItems.map((item) => item.id));
    expect(secondItems.some((item) => firstIds.has(item.id))).toBe(false);
  });

  it('lista e busca veículos', () => {
    const first = repository.create({ name: 'Gol' });
    const second = repository.create({ name: 'Onix' });

    expect(repository.list().map((vehicle) => vehicle.id)).toEqual([first.id, second.id]);
    expect(repository.getById(first.id)).toEqual(first);
    expect(repository.getById(9999)).toBeUndefined();
  });

  it('atualiza um veículo', () => {
    const vehicle = repository.create({ name: 'Gol' });

    const updated = repository.update(vehicle.id, {
      name: 'Gol G6',
      plate: 'ABC1D23',
      odometerKm: 47000,
      odometerUpdatedAt: ODOMETER_UPDATED_AT,
    });

    expect(updated).toMatchObject({
      id: vehicle.id,
      name: 'Gol G6',
      plate: 'ABC1D23',
      odometerKm: 47000,
      odometerUpdatedAt: ODOMETER_UPDATED_AT,
    });
    expect(repository.getById(vehicle.id)).toEqual(updated);
  });

  it('retorna o veículo atual quando a atualização está vazia', () => {
    const vehicle = repository.create({ name: 'Gol' });

    expect(repository.update(vehicle.id, {})).toEqual(vehicle);
    expect(repository.update(9999, {})).toBeUndefined();
  });

  it('remove um veículo e seus dados relacionados', () => {
    const vehicle = repository.create({ name: 'Gol' });
    const itemRepository = new MaintenanceItemRepository(db);
    const odometerRepository = new OdometerRepository(db);
    const logRepository = new LogRepository(db);
    const [item] = itemRepository.listByVehicle(vehicle.id);

    expect(item).toBeDefined();

    const reading = odometerRepository.create({
      vehicleId: vehicle.id,
      km: 45000,
      readAt: ODOMETER_UPDATED_AT,
    });
    const log = logRepository.create({
      itemId: item!.id,
      doneAt: ODOMETER_UPDATED_AT,
      km: 45000,
    });

    expect(repository.delete(vehicle.id)).toBe(true);
    expect(repository.getById(vehicle.id)).toBeUndefined();
    expect(itemRepository.listByVehicle(vehicle.id)).toEqual([]);
    expect(odometerRepository.getById(reading.id)).toBeUndefined();
    expect(logRepository.getById(log.id)).toBeUndefined();
  });

  it('retorna false ao remover um veículo inexistente', () => {
    expect(repository.delete(9999)).toBe(false);
  });
});
