import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { sql } from 'drizzle-orm';

import migrations from '@/data/db/migrations/migrations';
import { createTestDatabase } from '@/data/db/testing/test-database';

function migrationsUpTo(count: number): typeof migrations {
  const entries = migrations.journal.entries.slice(0, count);
  const selected: Record<string, string> = {};

  for (const entry of entries) {
    const key = `m${String(entry.idx).padStart(4, '0')}`;
    selected[key] = (migrations.migrations as Record<string, string>)[key];
  }

  return {
    journal: { ...migrations.journal, entries },
    migrations: selected,
  } as typeof migrations;
}

describe('migrations', () => {
  it('cria as tabelas do modelo de dados', async () => {
    const db = await createTestDatabase();
    const tables = db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
    );

    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining([
        'vehicles',
        'odometer_readings',
        'maintenance_items',
        'maintenance_logs',
      ]),
    );
  });

  it('adiciona as colunas de baseline imutável', async () => {
    const db = await createTestDatabase();
    const columns = db.all<{ name: string }>(sql`PRAGMA table_info('maintenance_items')`);

    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['baseline_km', 'baseline_at']),
    );
  });

  it('adiciona a coluna de descrição do item', async () => {
    const db = await createTestDatabase();
    const columns = db.all<{ name: string }>(sql`PRAGMA table_info('maintenance_items')`);

    expect(columns.map((column) => column.name)).toContain('description');
  });

  it('pode ser executada novamente sem duplicar dados', async () => {
    const db = await createTestDatabase();

    await expect(migrate(db, migrations)).resolves.toBeUndefined();
  });

  it('adiciona as limpezas de sensores aos veículos existentes', async () => {
    const db = await createTestDatabase(migrationsUpTo(2));

    db.run(
      sql`INSERT INTO vehicles (name, odometer_km, odometer_updated_at)
          VALUES ('Gol', 12345, '2026-01-01T00:00:00.000Z')`,
    );

    await migrate(db, migrations);

    const items = db.all<{
      name: string;
      intervalKm: number | null;
      intervalMonths: number | null;
      baselineKm: number | null;
      baselineAt: string | null;
    }>(sql`SELECT name, interval_km AS intervalKm, interval_months AS intervalMonths,
                  baseline_km AS baselineKm, baseline_at AS baselineAt
           FROM maintenance_items ORDER BY name`);

    expect(items).toEqual(
      expect.arrayContaining([
        {
          name: 'limpeza da sonda lambda',
          intervalKm: 40000,
          intervalMonths: 24,
          baselineKm: 12345,
          baselineAt: expect.any(String),
        },
        {
          name: 'limpeza do sensor MAP',
          intervalKm: 30000,
          intervalMonths: 24,
          baselineKm: 12345,
          baselineAt: expect.any(String),
        },
        {
          name: 'limpeza do sensor MAF',
          intervalKm: 30000,
          intervalMonths: 24,
          baselineKm: 12345,
          baselineAt: expect.any(String),
        },
      ]),
    );
  });

  it('renomeia o item velas para velas de ignição nos veículos existentes', async () => {
    const db = await createTestDatabase(migrationsUpTo(3));

    db.run(
      sql`INSERT INTO vehicles (name, odometer_km, odometer_updated_at)
          VALUES ('Gol', 0, '2026-01-01T00:00:00.000Z')`,
    );
    db.run(
      sql`INSERT INTO maintenance_items (vehicle_id, name, interval_km, interval_months, baseline_km, baseline_at)
          VALUES (1, 'velas', 30000, 36, 0, '2026-01-01T00:00:00.000Z')`,
    );

    await migrate(db, migrations);

    const items = db.all<{ name: string }>(sql`SELECT name FROM maintenance_items`);

    expect(items).toEqual([{ name: 'velas de ignição' }]);
  });
});
