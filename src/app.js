const express  = require('express');
const path     = require('path');
const session  = require('express-session');

const authRouter     = require('./routes/auth');
const linksRouter    = require('./routes/links');
const trackingRouter = require('./routes/tracking');
const statsRouter    = require('./routes/stats');
const { requireAuth }  = require('./middleware/auth');
const authController   = require('./controllers/authController');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 1000 * 60 * 60 * 8 },
}));

// Routes publiques
app.use(authRouter);
app.use('/track', trackingRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Dashboard
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API protégée
app.get('/api/me',          requireAuth, authController.me);
app.use('/api/links',       requireAuth, linksRouter);
app.use('/api/stats',       requireAuth, statsRouter);

module.exports = app;
