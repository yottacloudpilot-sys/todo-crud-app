"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDb = exports.initDb = exports.getDb = void 0;
const node_sqlite_1 = require("node:sqlite");
const path_1 = __importDefault(require("path"));
const dbPath = process.env.DB_PATH ?? path_1.default.join(process.cwd(), 'todos.db');
let db;
function getDb() {
    if (!db) {
        db = new node_sqlite_1.DatabaseSync(dbPath);
        initSchema();
    }
    return db;
}
exports.getDb = getDb;
function initDb(customPath) {
    db = new node_sqlite_1.DatabaseSync(customPath ?? dbPath);
    initSchema();
    return db;
}
exports.initDb = initDb;
function initSchema() {
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
function closeDb() {
    if (db) {
        db.close();
        db = undefined;
    }
}
exports.closeDb = closeDb;
//# sourceMappingURL=db.js.map