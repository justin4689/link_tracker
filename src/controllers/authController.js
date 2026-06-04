const bcrypt = require('bcryptjs');
const path   = require('path');
const db     = require('../db');

exports.showLogin = (req, res) => {
  if (req.session?.userId) return res.redirect('/');
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
  res.redirect('/');
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

exports.showRegister = (req, res) => {
  if (req.session?.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, '../../public/register.html'));
};

exports.register = async (req, res) => {
  const { username, password, confirm } = req.body;

  if (!username || !password)  return res.redirect('/register?error=empty');
  if (password !== confirm)    return res.redirect('/register?error=mismatch');
  if (password.length < 6)     return res.redirect('/register?error=short');

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.redirect('/register?error=taken');

  const hash   = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash);

  req.session.userId   = result.lastInsertRowid;
  req.session.username = username;
  res.redirect('/');
};

exports.me = (req, res) => {
  res.json({ username: req.session.username });
};
