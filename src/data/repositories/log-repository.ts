import { desc, eq } from 'drizzle-orm';

import { maintenanceLogs } from '@/data/db/schema';
import type { MaintenanceLog } from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';

export interface CreateLogInput {
  itemId: number;
  doneAt: string;
  km: number;
  costCents?: number | null;
  notes?: string | null;
}

export interface UpdateLogInput {
  doneAt?: string;
  km?: number;
  costCents?: number | null;
  notes?: string | null;
}

export class LogRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: CreateLogInput): MaintenanceLog {
    const [log] = this.db
      .insert(maintenanceLogs)
      .values({
        itemId: input.itemId,
        doneAt: input.doneAt,
        km: input.km,
        costCents: input.costCents ?? null,
        notes: input.notes ?? null,
      })
      .returning()
      .all();

    if (!log) {
      throw new Error('Não foi possível registrar a manutenção.');
    }

    return log;
  }

  listByItem(itemId: number): MaintenanceLog[] {
    return this.db
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.itemId, itemId))
      .orderBy(desc(maintenanceLogs.doneAt), desc(maintenanceLogs.id))
      .all();
  }

  getById(id: number): MaintenanceLog | undefined {
    return this.db.select().from(maintenanceLogs).where(eq(maintenanceLogs.id, id)).get();
  }

  update(id: number, input: UpdateLogInput): MaintenanceLog | undefined {
    const values: UpdateLogInput = {};

    if (input.doneAt !== undefined) values.doneAt = input.doneAt;
    if (input.km !== undefined) values.km = input.km;
    if (input.costCents !== undefined) values.costCents = input.costCents;
    if (input.notes !== undefined) values.notes = input.notes;

    if (Object.keys(values).length === 0) {
      return this.getById(id);
    }

    return this.db
      .update(maintenanceLogs)
      .set(values)
      .where(eq(maintenanceLogs.id, id))
      .returning()
      .get();
  }

  delete(id: number): boolean {
    const result = this.db.delete(maintenanceLogs).where(eq(maintenanceLogs.id, id)).run();
    return result.changes > 0;
  }
}
