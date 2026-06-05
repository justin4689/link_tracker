require('dotenv').config();
const app              = require('./src/app');
const { initSchema }   = require('./src/db');

const PORT = process.env.PORT || 3000;

initSchema()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1); });
