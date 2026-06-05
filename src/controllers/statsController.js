const { client } = require('../db');

exports.getStats = async (req, res) => {
  try {
    const uid = req.session.userId;

    const { rows: links } = await client.execute({
      sql: `SELECT l.*, COUNT(c.id) as clicks
            FROM links l LEFT JOIN clicks c ON l.id = c.link_id
            WHERE l.user_id = ?
            GROUP BY l.id ORDER BY l.created_at DESC`,
      args: [uid],
    });

    const { rows: recent } = await client.execute({
      sql: `SELECT c.* FROM clicks c
            INNER JOIN links l ON c.link_id = l.id
            WHERE l.user_id = ?
            ORDER BY c.created_at DESC LIMIT 50`,
      args: [uid],
    });

    const { rows: daily } = await client.execute({
      sql: `SELECT DATE(created_at) as day, COUNT(*) as count
            FROM clicks
            WHERE link_id IN (SELECT id FROM links WHERE user_id = ?)
              AND DATE(created_at) >= DATE('now', '-6 days')
            GROUP BY DATE(created_at) ORDER BY day ASC`,
      args: [uid],
    });

    const { rows: todayRows } = await client.execute({
      sql: `SELECT COUNT(*) as count FROM clicks
            WHERE link_id IN (SELECT id FROM links WHERE user_id = ?)
              AND DATE(created_at) = DATE('now')`,
      args: [uid],
    });

    res.json({ links, recent, daily, todayClicks: todayRows[0]?.count || 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
