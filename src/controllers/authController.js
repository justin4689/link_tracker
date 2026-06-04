const bcrypt = require('bcryptjs');
const path   = require('path');
const db     = require('../db');

exports.showLogin = (req, res) => {
  if (req.session?.userId) {
    return res.redirect(req.session.role === 'admin' ? '/admin' : '/');
  }
  res.sendFile(path.join(__dirname, '../../public/login.html'));
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.redirect('/login?error=1');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.redirect('/login?error=1');

  req.session.userId   = user.id;
  req.session.username = user.username;
  req.session.role     = user.role;

  res.redirect(user.role === 'admin' ? '/admin' : '/');
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

exports.me = (req, res) => {
  res.json({ username: req.session.username, role: req.session.role });
};
