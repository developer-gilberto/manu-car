import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  plate: text('plate'),
  odometerKm: integer('odometer_km').notNull().default(0),
  odometerUpdatedAt: text('odometer_updated_at').notNull(),
});

export const odometerReadings = sqliteTable(
  'odometer_readings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    vehicleId: integer('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    km: integer('km').notNull(),
    readAt: text('read_at').notNull(),
  },
  (table) => [index('odometer_readings_vehicle_id_idx').on(table.vehicleId)],
);

export const maintenanceItems = sqliteTable(
  'maintenance_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    vehicleId: integer('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    intervalKm: integer('interval_km'),
    intervalMonths: integer('interval_months'),
    lastDoneKm: integer('last_done_km'),
    lastDoneAt: text('last_done_at'),
    notifyEnabled: integer('notify_enabled', { mode: 'boolean' }).notNull().default(true),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [index('maintenance_items_vehicle_id_idx').on(table.vehicleId)],
);

export const maintenanceLogs = sqliteTable(
  'maintenance_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => maintenanceItems.id, { onDelete: 'cascade' }),
    doneAt: text('done_at').notNull(),
    km: integer('km').notNull(),
    costCents: integer('cost_cents'),
    notes: text('notes'),
  },
  (table) => [index('maintenance_logs_item_id_idx').on(table.itemId)],
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type OdometerReading = typeof odometerReadings.$inferSelect;
export type NewOdometerReading = typeof odometerReadings.$inferInsert;
export type MaintenanceItem = typeof maintenanceItems.$inferSelect;
export type NewMaintenanceItem = typeof maintenanceItems.$inferInsert;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type NewMaintenanceLog = typeof maintenanceLogs.$inferInsert;
