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

// Public
app.use(authRouter);
app.use('/track', trackingRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Admin — accessible uniquement par role=admin
app.use('/admin', requireAuth, requireAdmin, adminRouter);

// Dashboard — accessible uniquement par role=user
app.get('/', requireAuth, requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API protégée — tous les connectés
app.get('/api/me',               requireAuth, authController.me);
app.post('/api/me/password',     requireAuth, authController.changePassword);

// API dashboard — users seulement
app.use('/api/links', requireAuth, requireUser, linksRouter);
app.use('/api/stats', requireAuth, requireUser, statsRouter);

module.exports = app;
