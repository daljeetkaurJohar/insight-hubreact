// API routes for entries, images, comments and ratings.
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { knex } = require('./db');
const config = require('./config');

const router = express.Router();

const CHANNELS = [
  'Literature Sources', 'Conferences & Workshops', 'Digital Portals', 'Customer Insights',
  'Field Exposure-Visits', 'Market Insights', 'Experiential Learning', 'Specialized Domain', 'Others',
];
const NATURES = ['Observation', 'Idea', 'Problem'];
const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };
const MAX_IMAGES = 10;

fs.mkdirSync(config.uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + IMAGE_TYPES[file.mimetype]),
  }),
  limits: { fileSize: config.maxImageBytes, files: MAX_IMAGES },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
    const err = new Error(`"${file.originalname}" is not a JPG, PNG, GIF or WebP image.`);
    err.status = 400;
    cb(err);
  },
});

// ── helpers ──────────────────────────────────────────────────
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function toDateStr(v) {
  if (!v) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}
function toIso(v) {
  if (!v) return null;
  if (typeof v === 'string') return new Date(v.replace(' ', 'T') + (v.includes('Z') ? '' : 'Z')).toISOString();
  return v.toISOString();
}

function removeFiles(files) {
  for (const f of files || []) fs.unlink(f.path || path.join(config.uploadDir, f), () => {});
}

function clean(v, max) {
  const s = (v == null ? '' : String(v)).trim();
  return s ? s.slice(0, max) : null;
}

function readEntryFields(body) {
  const row = {
    title: clean(body.title, 300),
    channel: clean(body.channel, 100),
    sub_type: clean(body.subType, 200),
    nature: clean(body.nature, 20) || 'Observation',
    source: clean(body.source, 300),
    location: clean(body.location, 300),
    entry_date: clean(body.date, 10),
    description: clean(body.description, 20000),
  };
  if (!row.title) throw new HttpError(400, 'Title is required.');
  if (!CHANNELS.includes(row.channel)) throw new HttpError(400, 'Please choose a scanning channel.');
  if (!NATURES.includes(row.nature)) throw new HttpError(400, 'Nature must be Observation, Idea or Problem.');
  if (!row.entry_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.entry_date) || isNaN(Date.parse(row.entry_date)))
    throw new HttpError(400, 'Please give a valid date.');
  if (!row.description) throw new HttpError(400, 'Description is required.');
  return row;
}

// Inserts a row and returns its new id (SQL Server needs "returning", MySQL gives the id directly).
async function insertAndGetId(db, table, row) {
  const result = config.db.client === 'mssql'
    ? await db(table).insert(row, ['id'])
    : await db(table).insert(row);
  const first = result[0];
  return typeof first === 'object' ? first.id : first;
}

// Loads entries with their images, comments and ratings, shaped for the React app.
async function loadEntries(userId, onlyId) {
  let q = knex('entries as e')
    .join('users as u', 'u.id', 'e.contributor_id')
    .select('e.*', 'u.name as contributor_name')
    .orderBy([{ column: 'e.entry_date', order: 'desc' }, { column: 'e.id', order: 'desc' }]);
  if (onlyId) q = q.where('e.id', onlyId);
  const rows = await q;
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [images, comments, ratings] = await Promise.all([
    knex('entry_images').whereIn('entry_id', ids).orderBy('id'),
    knex('comments as c').join('users as u', 'u.id', 'c.user_id')
      .whereIn('c.entry_id', ids).select('c.*', 'u.name as author').orderBy('c.id'),
    knex('ratings').whereIn('entry_id', ids),
  ]);

  const group = (list) => list.reduce((m, x) => ((m[x.entry_id] = m[x.entry_id] || []).push(x), m), {});
  const imgBy = group(images), comBy = group(comments), ratBy = group(ratings);

  return rows.map((r) => {
    const rs = ratBy[r.id] || [];
    const mine = rs.find((x) => x.user_id === userId);
    return {
      id: r.id,
      title: r.title,
      channel: r.channel,
      subType: r.sub_type,
      nature: r.nature,
      source: r.source,
      location: r.location,
      date: toDateStr(r.entry_date),
      description: r.description,
      contributor: { id: r.contributor_id, name: r.contributor_name },
      isMine: r.contributor_id === userId,
      createdAt: toIso(r.created_at),
      images: (imgBy[r.id] || []).map((i) => ({ id: i.id, url: `/uploads/${i.file_name}` })),
      comments: (comBy[r.id] || []).map((c) => ({
        id: c.id, author: c.author, userId: c.user_id, text: c.body, createdAt: toIso(c.created_at),
      })),
      ratings: {
        count: rs.length,
        average: rs.length ? rs.reduce((s, x) => s + x.stars, 0) / rs.length : 0,
        mine: mine ? mine.stars : 0,
      },
    };
  });
}

async function getOwnedEntry(req) {
  const id = Number(req.params.id);
  const entry = await knex('entries').where({ id }).first();
  if (!entry) throw new HttpError(404, 'Entry not found.');
  if (entry.contributor_id !== req.user.id) throw new HttpError(403, 'Only the person who added this entry can change it.');
  return entry;
}

async function getEntryOr404(id) {
  const entry = await knex('entries').where({ id: Number(id) }).first();
  if (!entry) throw new HttpError(404, 'Entry not found.');
  return entry;
}

// ── routes ───────────────────────────────────────────────────
router.get('/me', (req, res) => res.json(req.user));

router.get('/entries', wrap(async (req, res) => {
  res.json(await loadEntries(req.user.id));
}));

router.post('/entries', upload.array('images', MAX_IMAGES), wrap(async (req, res) => {
  try {
    const row = readEntryFields(req.body);
    const id = await knex.transaction(async (trx) => {
      const newId = await insertAndGetId(trx, 'entries', { ...row, contributor_id: req.user.id });
      for (const f of req.files || []) {
        await trx('entry_images').insert({ entry_id: newId, file_name: f.filename, original_name: clean(f.originalname, 255) });
      }
      return newId;
    });
    const [entry] = await loadEntries(req.user.id, id);
    res.status(201).json(entry);
  } catch (err) {
    removeFiles(req.files);
    throw err;
  }
}));

// Edit: owner only. New images are added; send removeImageIds (comma-separated) to delete some.
router.put('/entries/:id', upload.array('images', MAX_IMAGES), wrap(async (req, res) => {
  try {
    const entry = await getOwnedEntry(req);
    const row = readEntryFields(req.body);
    const removeIds = String(req.body.removeImageIds || '').split(',').map(Number).filter(Boolean);
    const removed = await knex.transaction(async (trx) => {
      await trx('entries').where({ id: entry.id }).update({ ...row, updated_at: knex.fn.now() });
      let gone = [];
      if (removeIds.length) {
        gone = await trx('entry_images').where({ entry_id: entry.id }).whereIn('id', removeIds);
        await trx('entry_images').where({ entry_id: entry.id }).whereIn('id', removeIds).del();
      }
      for (const f of req.files || []) {
        await trx('entry_images').insert({ entry_id: entry.id, file_name: f.filename, original_name: clean(f.originalname, 255) });
      }
      return gone;
    });
    removeFiles(removed.map((i) => i.file_name));
    const [updated] = await loadEntries(req.user.id, entry.id);
    res.json(updated);
  } catch (err) {
    removeFiles(req.files);
    throw err;
  }
}));

router.delete('/entries/:id', wrap(async (req, res) => {
  const entry = await getOwnedEntry(req);
  const imgs = await knex('entry_images').where({ entry_id: entry.id });
  await knex.transaction(async (trx) => {
    await trx('ratings').where({ entry_id: entry.id }).del();
    await trx('comments').where({ entry_id: entry.id }).del();
    await trx('entry_images').where({ entry_id: entry.id }).del();
    await trx('entries').where({ id: entry.id }).del();
  });
  removeFiles(imgs.map((i) => i.file_name));
  res.status(204).end();
}));

router.post('/entries/:id/comments', wrap(async (req, res) => {
  const entry = await getEntryOr404(req.params.id);
  const text = clean(req.body && req.body.text, 5000);
  if (!text) throw new HttpError(400, 'Comment text is required.');
  await insertAndGetId(knex, 'comments', { entry_id: entry.id, user_id: req.user.id, body: text });
  const [updated] = await loadEntries(req.user.id, entry.id);
  res.status(201).json(updated);
}));

router.put('/entries/:id/rating', wrap(async (req, res) => {
  const entry = await getEntryOr404(req.params.id);
  const stars = Number(req.body && req.body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new HttpError(400, 'Stars must be 1 to 5.');
  await knex.transaction(async (trx) => {
    const key = { entry_id: entry.id, user_id: req.user.id };
    const n = await trx('ratings').where(key).update({ stars, updated_at: knex.fn.now() });
    if (!n) await trx('ratings').insert({ ...key, stars });
  });
  const [updated] = await loadEntries(req.user.id, entry.id);
  res.json(updated);
}));

module.exports = router;
