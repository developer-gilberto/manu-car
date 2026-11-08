import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type {
  SQLiteBindParams,
  SQLiteBindValue,
  SQLiteDatabase,
  SQLiteStatement,
} from 'expo-sqlite';
import { DatabaseSync } from 'node:sqlite';

import migrations from '@/data/db/migrations/migrations';
import * as schema from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';

type NodeBindValue = string | number | bigint | null | Uint8Array;

function toNodeBindValue(value: SQLiteBindValue): NodeBindValue {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return value;
}

function toNodeParams(
  params: SQLiteBindParams | undefined,
): NodeBindValue[] | Record<string, NodeBindValue> {
  if (params === undefined) {
    return [];
  }

  if (Array.isArray(params)) {
    return params.map(toNodeBindValue);
  }

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, toNodeBindValue(value)]),
  );
}

function createTestStatement(native: DatabaseSync, sql: string): SQLiteStatement {
  const statement = native.prepare(sql);
  const hasResultColumns = statement.columns().length > 0;

  const readStats = (): { changes: number; lastInsertRowId: number } => {
    const changes = native.prepare('SELECT changes() AS value').get() as
      { value: number } | undefined;
    const lastInsert = native.prepare('SELECT last_insert_rowid() AS value').get() as
      { value: number } | undefined;

    return {
      changes: changes?.value ?? 0,
      lastInsertRowId: lastInsert?.value ?? 0,
    };
  };

  const execute = (params: SQLiteBindParams | undefined, raw: boolean) => {
    const bound = toNodeParams(params);
    let rows: unknown[] = [];

    if (hasResultColumns) {
      statement.setReturnArrays(raw);
      rows = Array.isArray(bound) ? statement.all(...bound) : statement.all(bound);
      statement.setReturnArrays(false);
    } else if (Array.isArray(bound)) {
      statement.run(...bound);
    } else {
      statement.run(bound);
    }

    const { changes, lastInsertRowId } = readStats();

    return {
      changes,
      lastInsertRowId,
      getFirstSync: () => rows[0] ?? null,
      getAllSync: () => rows,
      resetSync: () => undefined,
      [Symbol.iterator]: () => rows[Symbol.iterator](),
    };
  };

  return {
    executeSync: (params: SQLiteBindParams) => execute(params, false),
    executeForRawResultSync: (params: SQLiteBindParams) => execute(params, true),
  } as unknown as SQLiteStatement;
}

function createTestClient(): SQLiteDatabase {
  const native = new DatabaseSync(':memory:');
  const statements = new Map<string, SQLiteStatement>();

  return {
    execSync: (sql: string) => native.exec(sql),
    prepareSync: (sql: string) => {
      const cached = statements.get(sql);

      if (cached) {
        return cached;
      }

      const statement = createTestStatement(native, sql);
      statements.set(sql, statement);
      return statement;
    },
  } as unknown as SQLiteDatabase;
}

export async function createTestDatabase(): Promise<AppDatabase> {
  const client = createTestClient();
  client.execSync('PRAGMA foreign_keys = ON;');

  const db = drizzle(client, { schema });
  await migrate(db, migrations);

  return db;
}
