const express  = require('express');
const path     = require('path');

const linksRouter    = require('./routes/links');
const trackingRouter = require('./routes/tracking');
const statsRouter    = require('./routes/stats');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use('/api/links', linksRouter);
app.use('/track',     trackingRouter);
app.use('/api/stats', statsRouter);

module.exports = app;
