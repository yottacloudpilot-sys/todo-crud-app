import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'todos.db');

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(dbPath);
    initSchema();
  }
  return db;
}

export function initDb(customPath?: string): DatabaseSync {
  db = new DatabaseSync(customPath ?? dbPath);
  initSchema();
  return db;
}

function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT    DEFAULT NULL,
      completed   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = undefined as unknown as DatabaseSync;
  }
}
