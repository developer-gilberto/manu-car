import { createTestDatabase } from '@/data/db/testing/test-database';
import type { AppDatabase } from '@/data/db/types';
import { LogRepository } from '@/data/repositories/log-repository';
import { MaintenanceItemRepository } from '@/data/repositories/maintenance-item-repository';
import { VehicleRepository } from '@/data/repositories/vehicle-repository';

const FIRST_DONE_AT = '2026-01-10T08:00:00.000Z';
const SECOND_DONE_AT = '2026-02-10T08:00:00.000Z';

describe('LogRepository', () => {
  let db: AppDatabase;
  let itemId: number;
  let repository: LogRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    const vehicleId = new VehicleRepository(db).create({ name: 'Gol' }).id;
    const itemRepository = new MaintenanceItemRepository(db);
    const [item] = itemRepository.listByVehicle(vehicleId);

    if (!item) {
      throw new Error('Item de seed não encontrado.');
    }

    itemId = item.id;
    repository = new LogRepository(db);
  });

  it('registra uma manutenção', () => {
    const log = repository.create({
      itemId,
      doneAt: FIRST_DONE_AT,
      km: 45000,
      costCents: 12990,
      notes: 'Troca feita na concessionária',
    });

    expect(log.id).toBeGreaterThan(0);
    expect(log).toMatchObject({
      itemId,
      doneAt: FIRST_DONE_AT,
      km: 45000,
      costCents: 12990,
      notes: 'Troca feita na concessionária',
    });
  });

  it('lista as manutenções da mais recente para a mais antiga', () => {
    const first = repository.create({ itemId, doneAt: FIRST_DONE_AT, km: 45000 });
    const second = repository.create({ itemId, doneAt: SECOND_DONE_AT, km: 46000 });

    expect(repository.listByItem(itemId).map((log) => log.id)).toEqual([second.id, first.id]);
  });

  it('busca uma manutenção por id', () => {
    const log = repository.create({ itemId, doneAt: FIRST_DONE_AT, km: 45000 });

    expect(repository.getById(log.id)).toEqual(log);
    expect(repository.getById(9999)).toBeUndefined();
  });

  it('atualiza uma manutenção', () => {
    const log = repository.create({ itemId, doneAt: FIRST_DONE_AT, km: 45000 });

    const updated = repository.update(log.id, {
      doneAt: SECOND_DONE_AT,
      km: 46000,
      costCents: 15990,
      notes: 'Revisão completa',
    });

    expect(updated).toMatchObject({
      id: log.id,
      doneAt: SECOND_DONE_AT,
      km: 46000,
      costCents: 15990,
      notes: 'Revisão completa',
    });
    expect(repository.getById(log.id)).toEqual(updated);
  });

  it('permite limpar custo e observação', () => {
    const log = repository.create({
      itemId,
      doneAt: FIRST_DONE_AT,
      km: 45000,
      costCents: 12990,
      notes: 'Troca',
    });

    const updated = repository.update(log.id, { costCents: null, notes: null });

    expect(updated).toMatchObject({ costCents: null, notes: null });
  });

  it('retorna a manutenção atual quando a atualização está vazia', () => {
    const log = repository.create({ itemId, doneAt: FIRST_DONE_AT, km: 45000 });

    expect(repository.update(log.id, {})).toEqual(log);
    expect(repository.update(9999, {})).toBeUndefined();
  });

  it('remove uma manutenção', () => {
    const log = repository.create({ itemId, doneAt: FIRST_DONE_AT, km: 45000 });

    expect(repository.delete(log.id)).toBe(true);
    expect(repository.getById(log.id)).toBeUndefined();
    expect(repository.delete(log.id)).toBe(false);
  });

  it('remove as manutenções quando o item é removido', () => {
    const log = repository.create({ itemId, doneAt: FIRST_DONE_AT, km: 45000 });
    const itemRepository = new MaintenanceItemRepository(db);

    expect(itemRepository.delete(itemId)).toBe(true);
    expect(repository.getById(log.id)).toBeUndefined();
  });
});
