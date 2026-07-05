const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not defined in the .env file.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

const migrationPath = path.join(__dirname, 'migration_round2.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('Connecting to PostgreSQL and applying Round 2 migration...');

pool.query(sql)
  .then(() => {
    console.log('Migration applied successfully (bookings.updated_at, listings.certificate_url).');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
