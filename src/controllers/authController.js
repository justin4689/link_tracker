const bcrypt = require('bcryptjs');
const path   = require('path');
const { db, client } = require('../db');
const { users }      = require('../db/schema');
const { eq }         = require('drizzle-orm');

exports.showLogin = (req, res) => {
  if (req.session?.userId)
    return res.redirect(req.session.role === 'admin' ? '/admin' : '/');
  res.sendFile(path.join(__dirname, '../../public/login.html'));
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return res.redirect('/login?error=1');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.redirect('/login?error=1');

    req.session.userId   = user.id;
    req.session.username = user.username;
    req.session.role     = user.role;

    res.redirect(user.role === 'admin' ? '/admin' : '/');
  } catch (e) {
    console.error(e);
    res.redirect('/login?error=1');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

exports.me = (req, res) => {
  res.json({ username: req.session.username, role: req.session.role });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Champs requis' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'Mot de passe trop court (6 car. min)' });

    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hash }).where(eq(users.id, req.session.userId));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
