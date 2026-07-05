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

const schemaPath = path.join(__dirname, 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

console.log('Connecting to PostgreSQL and running schema initialization...');

pool.query(sql)
  .then(() => {
    console.log('Database schema initialized successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });