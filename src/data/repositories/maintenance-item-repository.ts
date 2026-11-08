import { asc, eq } from 'drizzle-orm';

import { maintenanceItems } from '@/data/db/schema';
import type { MaintenanceItem } from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';

export interface CreateMaintenanceItemInput {
  vehicleId: number;
  name: string;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  lastDoneKm?: number | null;
  lastDoneAt?: string | null;
  notifyEnabled?: boolean;
  archived?: boolean;
}

export interface UpdateMaintenanceItemInput {
  name?: string;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  lastDoneKm?: number | null;
  lastDoneAt?: string | null;
  notifyEnabled?: boolean;
  archived?: boolean;
}

export class MaintenanceItemRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: CreateMaintenanceItemInput): MaintenanceItem {
    const [item] = this.db
      .insert(maintenanceItems)
      .values({
        vehicleId: input.vehicleId,
        name: input.name,
        intervalKm: input.intervalKm ?? null,
        intervalMonths: input.intervalMonths ?? null,
        lastDoneKm: input.lastDoneKm ?? null,
        lastDoneAt: input.lastDoneAt ?? null,
        notifyEnabled: input.notifyEnabled ?? true,
        archived: input.archived ?? false,
      })
      .returning()
      .all();

    if (!item) {
      throw new Error('Não foi possível criar o item de manutenção.');
    }

    return item;
  }

  listByVehicle(vehicleId: number): MaintenanceItem[] {
    return this.db
      .select()
      .from(maintenanceItems)
      .where(eq(maintenanceItems.vehicleId, vehicleId))
      .orderBy(asc(maintenanceItems.id))
      .all();
  }

  getById(id: number): MaintenanceItem | undefined {
    return this.db.select().from(maintenanceItems).where(eq(maintenanceItems.id, id)).get();
  }

  update(id: number, input: UpdateMaintenanceItemInput): MaintenanceItem | undefined {
    const values: UpdateMaintenanceItemInput = {};

    if (input.name !== undefined) values.name = input.name;
    if (input.intervalKm !== undefined) values.intervalKm = input.intervalKm;
    if (input.intervalMonths !== undefined) values.intervalMonths = input.intervalMonths;
    if (input.lastDoneKm !== undefined) values.lastDoneKm = input.lastDoneKm;
    if (input.lastDoneAt !== undefined) values.lastDoneAt = input.lastDoneAt;
    if (input.notifyEnabled !== undefined) values.notifyEnabled = input.notifyEnabled;
    if (input.archived !== undefined) values.archived = input.archived;

    if (Object.keys(values).length === 0) {
      return this.getById(id);
    }

    return this.db
      .update(maintenanceItems)
      .set(values)
      .where(eq(maintenanceItems.id, id))
      .returning()
      .get();
  }

  delete(id: number): boolean {
    const result = this.db.delete(maintenanceItems).where(eq(maintenanceItems.id, id)).run();
    return result.changes > 0;
  }
}
