import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = './data/dashboard.db';

// Ensure data directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

export * from './schema.js';