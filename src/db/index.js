const bcrypt   = require('bcryptjs');
const Database = require('better-sqlite3');
const db       = new Database('tracker.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS links (
    id          TEXT PRIMARY KEY,
    destination TEXT,
    campaign    TEXT,
    user_id     INTEGER,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS clicks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id    TEXT,
    ip         TEXT,
    country    TEXT,
    city       TEXT,
    browser    TEXT,
    os         TEXT,
    device     TEXT,
    referer    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration : ajoute user_id sur links si absent (base existante)
const linksCols = db.pragma('table_info(links)').map(c => c.name);
if (!linksCols.includes('user_id')) {
  db.exec('ALTER TABLE links ADD COLUMN user_id INTEGER');
}

// Migration : crée un admin par défaut et rattache les liens orphelins
const noOwner = db.prepare('SELECT COUNT(*) as n FROM links WHERE user_id IS NULL').get();
if (noOwner.n > 0) {
  const hash    = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)').run('admin', hash);
  const admin   = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  db.prepare('UPDATE links SET user_id = ? WHERE user_id IS NULL').run(admin.id);
}

module.exports = db;
