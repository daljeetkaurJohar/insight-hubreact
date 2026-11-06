// Insight Hub API server.  Start with:  npm start
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('./config');
const { knex } = require('./db');
const { requireUser } = require('./auth');
const entriesRouter = require('./entries');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: ['http://localhost:5173'], credentials: false }));
app.use(express.json({ limit: '1mb' }));

// Public: lets you check the server is running.
app.get('/api/health', async (req, res) => {
  try {
    await knex.raw('select 1 as ok');
    res.json({ ok: true, database: 'connected', authMode: config.auth.mode });
  } catch (err) {
    res.status(500).json({ ok: false, database: 'not connected', error: err.message });
  }
});

// Everything else under /api needs a signed-in user.
app.use('/api', requireUser, entriesRouter);

// Uploaded images.
app.use('/uploads', express.static(config.uploadDir, { maxAge: '7d', fallthrough: false }));

// In production the built React app (frontend/dist) is served from here too.
const distDir = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Turns errors into a short message the React app can show.
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong.';
  if (err instanceof multer.MulterError) {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = `Each image must be smaller than ${config.maxImageBytes / 1048576} MB.`;
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can attach up to 10 images.';
  }
  if (status >= 500) {
    console.error(err);
    message = 'Server error. Check the backend window for details.';
  }
  res.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`Insight Hub API running at http://localhost:${config.port}`);
  console.log(`Database: ${config.db.client} / ${config.db.name} on ${config.db.host}`);
  console.log(`Sign-in mode: ${config.auth.mode}${config.auth.mode === 'dev' ? '  (TEST ONLY - not for real use)' : ''}`);
});
