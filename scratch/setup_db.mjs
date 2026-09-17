import pg from 'pg';
const { Client } = pg;

async function setup() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    database: 'postgres'
  });

  await client.connect();
  console.log('Connected to default postgres database.');

  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'sgst_bd'");
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE sgst_bd');
    console.log('Database sgst_bd created successfully!');
  } else {
    console.log('Database sgst_bd already exists.');
  }

  await client.end();
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
