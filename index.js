const express = require("express"); 
const path = require("path");
const Database = require('better-sqlite3');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');
const db = new Database('tracker.db');

const app = express();

const PORT = process.env.PORT || 3000
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Création de la base de données
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

// Créer un lien de suivi
app.post('/api/links', (req, res) => {
  const { destination, campaign } = req.body;
  const id = crypto.randomBytes(4).toString('hex').toUpperCase();
  db.prepare('INSERT INTO links VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .run(id, destination, campaign || '');
  res.json({ id, url: `${req.protocol}://${req.get('host')}/track/${id}` });
});

// Tracking du clic
app.get('/track/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).send('Lien introuvable');

  // Collecte des infos
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  const geo = geoip.lookup(ip) || {};
  const ua = new UAParser(req.headers['user-agent']);

  db.prepare(`INSERT INTO clicks (link_id, ip, country, city, browser, os, device, referer)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      req.params.id,
      ip,
      geo.country || 'Inconnu',
      geo.city || 'Inconnu',
      ua.getBrowser().name || 'Inconnu',
      ua.getOS().name || 'Inconnu',
      ua.getDevice().type || 'desktop',
      req.headers['referer'] || 'Direct'
    );

  // Redirection immédiate
  res.redirect(link.destination);
});

// API tableau de bord
app.get('/api/stats', (req, res) => {
  const links = db.prepare(`
    SELECT l.*, COUNT(c.id) as clicks 
    FROM links l LEFT JOIN clicks c ON l.id = c.link_id
    GROUP BY l.id ORDER BY l.created_at DESC
  `).all();
  const recent = db.prepare('SELECT * FROM clicks ORDER BY created_at DESC LIMIT 50').all();
  res.json({ links, recent });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})