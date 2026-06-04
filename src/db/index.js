const bcrypt   = require('bcryptjs');
const Database = require('better-sqlite3');
const db       = new Database('tracker.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'user',
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

// Migration : user_id sur links
const linksCols = db.pragma('table_info(links)').map(c => c.name);
if (!linksCols.includes('user_id')) {
  db.exec('ALTER TABLE links ADD COLUMN user_id INTEGER');
}

// Migration : role sur users
const usersCols = db.pragma('table_info(users)').map(c => c.name);
if (!usersCols.includes('role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
}

// S'assurer qu'il existe un admin avec role='admin'
const admin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!admin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')").run(hash);
} else {
  db.prepare("UPDATE users SET role = 'admin' WHERE username = 'admin'").run();
}

// Migration : supprimer les liens orphelins (créés avant le système multi-utilisateurs)
db.prepare('DELETE FROM clicks WHERE link_id IN (SELECT id FROM links WHERE user_id IS NULL)').run();
db.prepare('DELETE FROM links WHERE user_id IS NULL').run();

module.exports = db;
