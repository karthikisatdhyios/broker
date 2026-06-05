import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');

/**
 * Persistence uses NeDB (pure-JS, file-backed) so the app runs with ZERO
 * external setup — no database server, no Docker, no binary downloads.
 * Each collection is stored as an append-only file under backend/data/.
 *
 * To swap in MongoDB/Postgres later, replace src/db/odm.js with a driver of
 * your choice; the models/controllers use a Mongoose-like API.
 */
export async function connectDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`[db] Using file-backed datastore at ${DATA_DIR}`);
  return DATA_DIR;
}

export async function disconnectDB() {
  // NeDB has no persistent connection to close.
}
