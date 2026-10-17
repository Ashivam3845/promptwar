import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

async function runMigrations() {
  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.yjecfzhffignnakibjec',
    password: '@evolveai234$',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL!');

  const migration1 = fs.readFileSync(path.join('supabase', 'migrations', '20261017_init_gigsaathi.sql'), 'utf-8');
  console.log('Executing migration 1: 20261017_init_gigsaathi.sql ...');
  await client.query(migration1);
  console.log('Migration 1 executed successfully!');

  const migration2 = fs.readFileSync(path.join('supabase', 'migrations', '20261018_auth_profile_trigger.sql'), 'utf-8');
  console.log('Executing migration 2: 20261018_auth_profile_trigger.sql ...');
  await client.query(migration2);
  console.log('Migration 2 executed successfully!');

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Public tables in Supabase:', tables.rows.map(r => r.table_name));

  await client.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
