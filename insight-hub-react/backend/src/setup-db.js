// Creates the Insight Hub tables. Safe to run more than once:
// tables that already exist are left as they are.
//   Run with:  npm run setup-db
const { knex } = require('./db');
const config = require('./config');

async function createTable(name, build) {
  if (await knex.schema.hasTable(name)) {
    console.log(`  - ${name}: already exists, skipped`);
    return;
  }
  await knex.schema.createTable(name, (t) => {
    if (config.db.client === 'mysql') {
      t.charset('utf8mb4');
      t.collate('utf8mb4_unicode_ci');
    }
    build(t);
  });
  console.log(`  + ${name}: created`);
}

async function main() {
  console.log(`Connecting to ${config.db.client} database "${config.db.name}" on ${config.db.host} ...`);

  // People who have signed in. external_id is their Microsoft account id (or the test name in dev mode).
  await createTable('users', (t) => {
    t.increments('id').primary();
    t.string('external_id', 200).notNullable().unique();
    t.string('name', 200).notNullable();
    t.string('email', 320);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // One row per knowledge entry.
  await createTable('entries', (t) => {
    t.increments('id').primary();
    t.string('title', 300).notNullable();
    t.string('channel', 100).notNullable();
    t.string('sub_type', 200);
    t.string('nature', 20).notNullable(); // Observation | Idea | Problem
    t.string('source', 300);
    t.string('location', 300);
    t.date('entry_date').notNullable();
    t.text('description').notNullable();
    t.integer('contributor_id').unsigned().notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index(['entry_date']);
  });

  // Images attached to an entry. The file itself is saved in the uploads folder.
  await createTable('entry_images', (t) => {
    t.increments('id').primary();
    t.integer('entry_id').unsigned().notNullable().references('id').inTable('entries').onDelete('CASCADE');
    t.string('file_name', 255).notNullable();
    t.string('original_name', 255);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await createTable('comments', (t) => {
    t.increments('id').primary();
    t.integer('entry_id').unsigned().notNullable().references('id').inTable('entries').onDelete('CASCADE');
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    t.text('body').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // One rating (1-5 stars) per person per entry.
  await createTable('ratings', (t) => {
    t.integer('entry_id').unsigned().notNullable().references('id').inTable('entries').onDelete('CASCADE');
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    t.integer('stars').notNullable();
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.primary(['entry_id', 'user_id']);
  });

  console.log('Database is ready.');
}

main()
  .catch((err) => {
    console.error('\nCould not set up the database:\n  ' + err.message);
    console.error('\nCheck DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD in backend\\.env');
    process.exitCode = 1;
  })
  .finally(() => knex.destroy());
