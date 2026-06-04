const db = require('../db');

exports.getStats = (req, res) => {
  const links = db.prepare(`
    SELECT l.*, COUNT(c.id) as clicks
    FROM links l LEFT JOIN clicks c ON l.id = c.link_id
    GROUP BY l.id ORDER BY l.created_at DESC
  `).all();

  const recent = db.prepare(
    'SELECT * FROM clicks ORDER BY created_at DESC LIMIT 50'
  ).all();

  const daily = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM clicks
    WHERE DATE(created_at) >= DATE('now', '-6 days')
    GROUP BY DATE(created_at) ORDER BY day ASC
  `).all();

  const todayClicks = db.prepare(
    "SELECT COUNT(*) as count FROM clicks WHERE DATE(created_at) = DATE('now')"
  ).get();

  res.json({ links, recent, daily, todayClicks: todayClicks.count });
};
