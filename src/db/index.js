const { createClient } = require('@libsql/client');
const { drizzle }      = require('drizzle-orm/libsql');
const bcrypt           = require('bcryptjs');
const schema           = require('./schema');

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function initSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS links (
      id          TEXT PRIMARY KEY,
      destination TEXT NOT NULL,
      campaign    TEXT DEFAULT '',
      user_id     INTEGER,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await client.execute("SELECT id FROM users WHERE username = 'admin'");
  if (rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await client.execute({
      sql:  "INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')",
      args: [hash],
    });
    console.log('Admin créé — identifiants : admin / admin123');
  }
}

module.exports = { db, client, initSchema };
