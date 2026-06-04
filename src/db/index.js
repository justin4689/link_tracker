const Database = require('better-sqlite3');
const db = new Database('tracker.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    destination TEXT,
    campaign TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id TEXT,
    ip TEXT,
    country TEXT,
    city TEXT,
    browser TEXT,
    os TEXT,
    device TEXT,
    referer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
