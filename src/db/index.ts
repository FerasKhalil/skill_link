import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please add it in your Vercel project settings under Environment Variables. ' +
      'Example: postgresql://user:password@host:5432/dbname'
    );
  }

  return postgres(connectionString, {
    max: process.env.VERCEL ? 5 : 20,
    idle_timeout: process.env.VERCEL ? 5 : 20,
    connect_timeout: 10,
    prepare: false,
  });
}

let _client: ReturnType<typeof createClient> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    _client = createClient();
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
