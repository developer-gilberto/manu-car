import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { sql } from 'drizzle-orm';

import migrations from '@/data/db/migrations/migrations';
import { createTestDatabase } from '@/data/db/testing/test-database';

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

  it('pode ser executada novamente sem duplicar dados', async () => {
    const db = await createTestDatabase();

    await expect(migrate(db, migrations)).resolves.toBeUndefined();
  });
});
