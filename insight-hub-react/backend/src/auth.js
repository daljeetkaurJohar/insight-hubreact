// Works out who is calling the API.
//  - AUTH_MODE=entra: checks the Microsoft (Entra ID) access token sent by the React app.
//  - AUTH_MODE=dev:   TEST ONLY - trusts the name sent in the X-Dev-User header.
const { createRemoteJWKSet, jwtVerify } = require('jose');
const config = require('./config');
const { knex } = require('./db');

let jwks = null;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${config.auth.tenantId}/discovery/v2.0/keys`)
    );
  }
  return jwks;
}

async function identityFromEntraToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { tenantId, clientId } = config.auth;
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: [
      `https://login.microsoftonline.com/${tenantId}/v2.0`, // v2 tokens
      `https://sts.windows.net/${tenantId}/`, // v1 tokens
    ],
    audience: [clientId, `api://${clientId}`],
  });
  if (!payload.oid) return null;
  return {
    externalId: `entra:${payload.oid}`,
    name: payload.name || payload.preferred_username || 'Unknown user',
    email: payload.preferred_username || payload.upn || payload.email || null,
  };
}

function identityFromDevHeader(req) {
  const raw = (req.headers['x-dev-user'] || '').toString().trim();
  if (!raw) return null;
  const name = decodeURIComponent(raw).slice(0, 200);
  return { externalId: `dev:${name.toLowerCase()}`, name, email: null };
}

// Find the user in the database, or add them on their first visit.
async function upsertUser(identity) {
  const existing = await knex('users').where({ external_id: identity.externalId }).first();
  if (existing) {
    if (existing.name !== identity.name || (identity.email && existing.email !== identity.email)) {
      await knex('users')
        .where({ id: existing.id })
        .update({ name: identity.name, email: identity.email || existing.email });
    }
    return { id: existing.id, name: identity.name, email: identity.email || existing.email };
  }
  try {
    await knex('users').insert({
      external_id: identity.externalId,
      name: identity.name,
      email: identity.email,
    });
  } catch (err) {
    // Two requests at the same moment may both try to add the user; the second one just reads it.
  }
  const row = await knex('users').where({ external_id: identity.externalId }).first();
  return { id: row.id, name: row.name, email: row.email };
}

// Express middleware: rejects the request with 401 if nobody is signed in.
async function requireUser(req, res, next) {
  try {
    const identity =
      config.auth.mode === 'dev' ? identityFromDevHeader(req) : await identityFromEntraToken(req);
    if (!identity) return res.status(401).json({ error: 'Please sign in.' });
    req.user = await upsertUser(identity);
    next();
  } catch (err) {
    if (err && err.code && String(err.code).startsWith('ERR_J')) {
      return res.status(401).json({ error: 'Your sign-in has expired or is not valid. Please sign in again.' });
    }
    next(err);
  }
}

module.exports = { requireUser };
