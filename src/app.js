const express  = require('express');
const path     = require('path');
const session  = require('express-session');

const authRouter     = require('./routes/auth');
const adminRouter    = require('./routes/admin');
const linksRouter    = require('./routes/links');
const trackingRouter = require('./routes/tracking');
const statsRouter    = require('./routes/stats');
const { requireAuth, requireAdmin, requireUser } = require('./middleware/auth');
const authController = require('./controllers/authController');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 1000 * 60 * 60 * 8 },
}));

// Auth routes (login/logout) — publiques
app.use(authRouter);

// Tracking — public (les liens doivent fonctionner sans compte)
app.use('/r', trackingRouter);

// Garde sur les fichiers HTML avant express.static
app.use((req, res, next) => {
  if (!req.path.endsWith('.html') || req.path === '/login.html') return next();

  // Non connecté
  if (!req.session?.userId) {
    // Fragments chargés en fetch() depuis le dashboard → 401 silencieux
    if (req.path.startsWith('/pages/')) return res.status(401).send('');
    return res.redirect('/login');
  }

  // /admin.html → admin seulement
  if (req.path === '/admin.html' && req.session.role !== 'admin') return res.redirect('/');

  // /index.html → users seulement (pas admin)
  if (req.path === '/index.html' && req.session.role === 'admin') return res.redirect('/admin');

  next();
});

// Fichiers statiques — index:false pour que '/' ne serve pas index.html directement
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }));

// Dashboard — users seulement
app.get('/', requireAuth, requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Admin panel — admin seulement
app.use('/admin', requireAuth, requireAdmin, adminRouter);

// API — tous les connectés
app.get('/api/me',           requireAuth, authController.me);
app.post('/api/me/password', requireAuth, authController.changePassword);

// API dashboard — users seulement
app.use('/api/links', requireAuth, requireUser, linksRouter);
app.use('/api/stats', requireAuth, requireUser, statsRouter);

module.exports = app;
