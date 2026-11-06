// Database connection. The same code works with SQL Server and MySQL,
// because Knex translates each query into the right SQL dialect.
const knexLib = require('knex');
const config = require('./config');

function connectionSettings(withDatabase = true) {
  const c = config.db;
  if (c.client === 'mssql') {
    return {
      server: c.host,
      port: c.port || 1433,
      user: c.user,
      password: c.password,
      ...(withDatabase ? { database: c.name } : {}),
      options: { encrypt: c.encrypt, trustServerCertificate: !c.encrypt },
    };
  }
  return {
    host: c.host,
    port: c.port || 3306,
    user: c.user,
    password: c.password,
    ...(withDatabase ? { database: c.name } : {}),
    charset: 'utf8mb4', // stores emoji and every language correctly
    dateStrings: true, // return DATE columns as "YYYY-MM-DD", no time-zone shifts
  };
}

function makeKnex(withDatabase = true) {
  return knexLib({
    client: config.db.client === 'mssql' ? 'mssql' : 'mysql2',
    connection: connectionSettings(withDatabase),
    pool: { min: 0, max: 10 },
  });
}

const knex = makeKnex(true);

module.exports = { knex, makeKnex };
