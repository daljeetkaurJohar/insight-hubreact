// Reads the settings from the .env file in the backend folder.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = process.env;

const config = {
  port: Number(env.PORT || 3001),
  db: {
    client: (env.DB_CLIENT || 'mssql').toLowerCase(),
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT ? Number(env.DB_PORT) : undefined,
    name: env.DB_NAME || 'InsightHub',
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    encrypt: String(env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
  },
  auth: {
    mode: (env.AUTH_MODE || 'entra').toLowerCase(),
    tenantId: env.AZURE_TENANT_ID,
    clientId: env.AZURE_CLIENT_ID,
  },
  uploadDir: path.resolve(__dirname, '..', env.UPLOAD_DIR || 'uploads'),
  maxImageBytes: Number(env.MAX_IMAGE_MB || 8) * 1024 * 1024,
};

if (!['mssql', 'mysql'].includes(config.db.client)) {
  throw new Error(`DB_CLIENT must be "mssql" or "mysql" (got "${config.db.client}")`);
}
if (!['entra', 'dev'].includes(config.auth.mode)) {
  throw new Error(`AUTH_MODE must be "entra" or "dev" (got "${config.auth.mode}")`);
}

module.exports = config;
