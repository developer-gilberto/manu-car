import { desc, eq } from 'drizzle-orm';

import { odometerReadings } from '@/data/db/schema';
import type { OdometerReading } from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';

export interface CreateOdometerReadingInput {
  vehicleId: number;
  km: number;
  readAt: string;
}

export interface UpdateOdometerReadingInput {
  km?: number;
  readAt?: string;
}

export class OdometerRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: CreateOdometerReadingInput): OdometerReading {
    const [reading] = this.db.insert(odometerReadings).values(input).returning().all();

    if (!reading) {
      throw new Error('Não foi possível registrar a leitura do odômetro.');
    }

    return reading;
  }

  listByVehicle(vehicleId: number): OdometerReading[] {
    return this.db
      .select()
      .from(odometerReadings)
      .where(eq(odometerReadings.vehicleId, vehicleId))
      .orderBy(desc(odometerReadings.readAt), desc(odometerReadings.id))
      .all();
  }

  getById(id: number): OdometerReading | undefined {
    return this.db.select().from(odometerReadings).where(eq(odometerReadings.id, id)).get();
  }

  latestForVehicle(vehicleId: number): OdometerReading | undefined {
    return this.listByVehicle(vehicleId)[0];
  }

  update(id: number, input: UpdateOdometerReadingInput): OdometerReading | undefined {
    const values: UpdateOdometerReadingInput = {};

    if (input.km !== undefined) values.km = input.km;
    if (input.readAt !== undefined) values.readAt = input.readAt;

    if (Object.keys(values).length === 0) {
      return this.getById(id);
    }

    return this.db
      .update(odometerReadings)
      .set(values)
      .where(eq(odometerReadings.id, id))
      .returning()
      .get();
  }

  delete(id: number): boolean {
    const result = this.db.delete(odometerReadings).where(eq(odometerReadings.id, id)).run();
    return result.changes > 0;
  }
}
