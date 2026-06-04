const crypto = require('crypto');
const db     = require('../db');

exports.createLink = (req, res) => {
  const { destination, campaign } = req.body;
  if (!destination) return res.status(400).json({ error: 'destination requise' });

  const id = crypto.randomBytes(4).toString('hex').toUpperCase();
  db.prepare('INSERT INTO links (id, destination, campaign, user_id) VALUES (?, ?, ?, ?)')
    .run(id, destination, campaign || '', req.session.userId);

  res.json({ id, url: `${req.protocol}://${req.get('host')}/track/${id}` });
};

exports.getLinkClicks = (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!link) return res.status(404).json({ error: 'Lien introuvable' });

  const clicks = db.prepare(
    'SELECT * FROM clicks WHERE link_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);

  const daily = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM clicks
    WHERE link_id = ? AND DATE(created_at) >= DATE('now', '-29 days')
    GROUP BY DATE(created_at) ORDER BY day ASC
  `).all(req.params.id);

  const byCountry = db.prepare(`
    SELECT country, COUNT(*) as count FROM clicks
    WHERE link_id = ? AND country NOT IN ('Inconnu','Local')
    GROUP BY country ORDER BY count DESC LIMIT 10
  `).all(req.params.id);

  const byDevice = db.prepare(`
    SELECT device, COUNT(*) as count FROM clicks
    WHERE link_id = ? GROUP BY device ORDER BY count DESC
  `).all(req.params.id);

  const byBrowser = db.prepare(`
    SELECT browser, COUNT(*) as count FROM clicks
    WHERE link_id = ? AND browser != 'Inconnu'
    GROUP BY browser ORDER BY count DESC LIMIT 8
  `).all(req.params.id);

  res.json({ link, clicks, daily, byCountry, byDevice, byBrowser });
};
