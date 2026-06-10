const crypto  = require('crypto');
const { db, client } = require('../db');
const { links, clicks } = require('../db/schema');
const { eq, and } = require('drizzle-orm');

exports.createLink = async (req, res) => {
  try {
    const { destination, campaign } = req.body;
    if (!destination) return res.status(400).json({ error: 'destination requise' });

    const id = crypto.randomBytes(4).toString('hex').toUpperCase();
    await db.insert(links).values({
      id,
      destination,
      campaign: campaign || '',
      userId:   req.session.userId,
    });

    res.json({ id, url: `${req.protocol}://${req.get('host')}/r/${id}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getLinkClicks = async (req, res) => {
  try {
    const [link] = await db.select().from(links).where(
      and(eq(links.id, req.params.id), eq(links.userId, req.session.userId))
    );
    if (!link) return res.status(404).json({ error: 'Lien introuvable' });

    const { rows: clickRows } = await client.execute({
      sql:  'SELECT * FROM clicks WHERE link_id = ? ORDER BY created_at DESC',
      args: [req.params.id],
    });

    const { rows: daily } = await client.execute({
      sql:  `SELECT DATE(created_at) as day, COUNT(*) as count FROM clicks
             WHERE link_id = ? AND DATE(created_at) >= DATE('now', '-29 days')
             GROUP BY DATE(created_at) ORDER BY day ASC`,
      args: [req.params.id],
    });

    const { rows: byCountry } = await client.execute({
      sql:  `SELECT country, COUNT(*) as count FROM clicks
             WHERE link_id = ? AND country NOT IN ('Inconnu','Local')
             GROUP BY country ORDER BY count DESC LIMIT 10`,
      args: [req.params.id],
    });

    const { rows: byDevice } = await client.execute({
      sql:  `SELECT device, COUNT(*) as count FROM clicks
             WHERE link_id = ? GROUP BY device ORDER BY count DESC`,
      args: [req.params.id],
    });

    const { rows: byBrowser } = await client.execute({
      sql:  `SELECT browser, COUNT(*) as count FROM clicks
             WHERE link_id = ? AND browser != 'Inconnu'
             GROUP BY browser ORDER BY count DESC LIMIT 8`,
      args: [req.params.id],
    });

    res.json({ link, clicks: clickRows, daily, byCountry, byDevice, byBrowser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
