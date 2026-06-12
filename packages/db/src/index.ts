import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as relations from './relations';

export * from './schema';
export { schema, relations };

const fullSchema = { ...schema, ...relations };

export type DB = ReturnType<typeof drizzle<typeof fullSchema>>;

let _pool: Pool | undefined;
let _db: DB | undefined;

/**
 * Lazily creates the shared Drizzle instance.
 * 지연 생성 — import 시점에 DATABASE_URL을 강제하지 않아 schema/relations만 쓰는
 * 소비자(예: NestJS DatabaseModule)가 자체 커넥션을 구성할 수 있게 한다.
 */
export function getDb(): DB {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(_pool, { schema: fullSchema, casing: 'snake_case' });
  }
  return _db;
}
