const bcrypt = require('bcryptjs');
const path   = require('path');
const db     = require('../db');

exports.showPanel = (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin.html'));
};

exports.getUsers = (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, u.created_at,
           COUNT(l.id) as link_count
    FROM users u
    LEFT JOIN links l ON l.user_id = u.id
    GROUP BY u.id ORDER BY u.created_at ASC
  `).all();
  res.json({ users });
};

exports.createUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Champs requis' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Identifiant déjà utilisé' });

  const hash   = await bcrypt.hash(password, 10);
  const result = db.prepare(
    "INSERT INTO users (username, password, role) VALUES (?, ?, 'user')"
  ).run(username, hash);

  res.json({ id: result.lastInsertRowid, username });
};

exports.deleteUser = (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user)               return res.status(404).json({ error: 'Utilisateur introuvable' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Impossible de supprimer l\'admin' });

  const deleteClicks = db.prepare('DELETE FROM clicks WHERE link_id = ?');
  const links = db.prepare('SELECT id FROM links WHERE user_id = ?').all(user.id);
  db.transaction(() => {
    links.forEach(l => deleteClicks.run(l.id));
    db.prepare('DELETE FROM links   WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users   WHERE id = ?').run(user.id);
  })();

  res.json({ success: true });
};

exports.resetDb = (req, res) => {
  db.transaction(() => {
    db.exec("DELETE FROM clicks");
    db.exec("DELETE FROM links");
    db.exec("DELETE FROM users WHERE role != 'admin'");
  })();
  res.json({ success: true });
};
