const db = require('../db');

exports.getStats = (req, res) => {
  const uid = req.session.userId;

  const links = db.prepare(`
    SELECT l.*, COUNT(c.id) as clicks
    FROM links l LEFT JOIN clicks c ON l.id = c.link_id
    WHERE l.user_id = ?
    GROUP BY l.id ORDER BY l.created_at DESC
  `).all(uid);

  const recent = db.prepare(`
    SELECT c.* FROM clicks c
    INNER JOIN links l ON c.link_id = l.id
    WHERE l.user_id = ?
    ORDER BY c.created_at DESC LIMIT 50
  `).all(uid);

  const daily = db.prepare(`
    SELECT DATE(c.created_at) as day, COUNT(*) as count
    FROM clicks c INNER JOIN links l ON c.link_id = l.id
    WHERE l.user_id = ? AND DATE(c.created_at) >= DATE('now', '-6 days')
    GROUP BY DATE(c.created_at) ORDER BY day ASC
  `).all(uid);

  const todayClicks = db.prepare(`
    SELECT COUNT(*) as count FROM clicks c
    INNER JOIN links l ON c.link_id = l.id
    WHERE l.user_id = ? AND DATE(c.created_at) = DATE('now')
  `).get(uid);

  res.json({ links, recent, daily, todayClicks: todayClicks.count });
};
