import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';
import type { AppDatabase } from './types';

export const DATABASE_NAME = 'manu-car.db';

let database: AppDatabase | undefined;

export function getDatabase(): AppDatabase {
  if (!database) {
    const expoDatabase = openDatabaseSync(DATABASE_NAME);
    expoDatabase.execSync('PRAGMA foreign_keys = ON;');
    database = drizzle(expoDatabase, { schema });
  }

  return database;
}
