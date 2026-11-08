import { asc, eq } from 'drizzle-orm';

import { DEFAULT_MAINTENANCE_ITEM_NAMES } from '@/data/db/default-maintenance-items';
import { maintenanceItems, vehicles } from '@/data/db/schema';
import type { Vehicle } from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';

export interface CreateVehicleInput {
  name: string;
  plate?: string | null;
  odometerKm?: number;
  odometerUpdatedAt?: string;
}

export interface UpdateVehicleInput {
  name?: string;
  plate?: string | null;
  odometerKm?: number;
  odometerUpdatedAt?: string;
}

export class VehicleRepository {
  constructor(private readonly db: AppDatabase) {}

  create(input: CreateVehicleInput): Vehicle {
    return this.db.transaction((tx) => {
      const [vehicle] = tx
        .insert(vehicles)
        .values({
          name: input.name,
          plate: input.plate ?? null,
          odometerKm: input.odometerKm ?? 0,
          odometerUpdatedAt: input.odometerUpdatedAt ?? new Date().toISOString(),
        })
        .returning()
        .all();

      if (!vehicle) {
        throw new Error('Não foi possível criar o veículo.');
      }

      tx.insert(maintenanceItems)
        .values(
          DEFAULT_MAINTENANCE_ITEM_NAMES.map((name) => ({
            vehicleId: vehicle.id,
            name,
          })),
        )
        .run();

      return vehicle;
    });
  }

  list(): Vehicle[] {
    return this.db.select().from(vehicles).orderBy(asc(vehicles.id)).all();
  }

  getById(id: number): Vehicle | undefined {
    return this.db.select().from(vehicles).where(eq(vehicles.id, id)).get();
  }

  update(id: number, input: UpdateVehicleInput): Vehicle | undefined {
    const values: UpdateVehicleInput = {};

    if (input.name !== undefined) values.name = input.name;
    if (input.plate !== undefined) values.plate = input.plate;
    if (input.odometerKm !== undefined) values.odometerKm = input.odometerKm;
    if (input.odometerUpdatedAt !== undefined) {
      values.odometerUpdatedAt = input.odometerUpdatedAt;
    }

    if (Object.keys(values).length === 0) {
      return this.getById(id);
    }

    return this.db.update(vehicles).set(values).where(eq(vehicles.id, id)).returning().get();
  }

  delete(id: number): boolean {
    const result = this.db.delete(vehicles).where(eq(vehicles.id, id)).run();
    return result.changes > 0;
  }
}
