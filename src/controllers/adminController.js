const bcrypt = require('bcryptjs');
const path   = require('path');
const { db, client } = require('../db');
const { users, links, clicks } = require('../db/schema');
const { eq, ne } = require('drizzle-orm');

exports.showPanel = (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin.html'));
};

exports.getUsers = async (req, res) => {
  try {
    const { rows } = await client.execute(`
      SELECT u.id, u.username, u.role, u.created_at, COUNT(l.id) as link_count
      FROM users u LEFT JOIN links l ON l.user_id = u.id
      GROUP BY u.id ORDER BY u.created_at ASC
    `);
    res.json({ users: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Champs requis' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

    const [exists] = await db.select().from(users).where(eq(users.username, username));
    if (exists) return res.status(409).json({ error: 'Identifiant déjà utilisé' });

    const hash      = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users)
      .values({ username, password: hash, role: 'user' })
      .returning({ id: users.id });

    res.json({ id: newUser.id, username });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, Number(req.params.id)));
    if (!user)               return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (user.role === 'admin') return res.status(403).json({ error: "Impossible de supprimer l'admin" });

    await client.batch([
      { sql: 'DELETE FROM clicks WHERE link_id IN (SELECT id FROM links WHERE user_id = ?)', args: [user.id] },
      { sql: 'DELETE FROM links  WHERE user_id = ?', args: [user.id] },
      { sql: 'DELETE FROM users  WHERE id = ?',      args: [user.id] },
    ], 'write');

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

    const [user] = await db.select().from(users).where(eq(users.id, Number(req.params.id)));
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const hash = await bcrypt.hash(password, 10);
    await db.update(users).set({ password: hash }).where(eq(users.id, user.id));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.resetDb = async (req, res) => {
  try {
    await client.batch([
      { sql: 'DELETE FROM clicks', args: [] },
      { sql: 'DELETE FROM links',  args: [] },
      { sql: "DELETE FROM users WHERE role != 'admin'", args: [] },
    ], 'write');
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
