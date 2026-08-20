import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    _client = postgres(connectionString, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(_client, { schema });
  }
  return _db;
}

export function getClient() {
  if (!_client) {
    getDb();
  }
  return _client!;
}

export * from './schema';
