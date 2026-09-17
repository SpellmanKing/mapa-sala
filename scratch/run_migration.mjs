import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function run() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    database: 'sgst_bd'
  });

  await client.connect();
  console.log('Connected to sgst_bd.');

  const migrationSqlPath = path.resolve('backend/prisma/migrations/20260817205930_init_postgresql/migration.sql');
  const sql = fs.readFileSync(migrationSqlPath, 'utf8');

  console.log('Executing migration.sql...');
  await client.query(sql);
  console.log('Tables created successfully!');

  // Check tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log('Tables in public schema:', res.rows.map(r => r.table_name));

  await client.end();
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
