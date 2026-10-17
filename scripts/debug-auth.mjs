import pg from 'pg';
const { Client } = pg;

async function checkAuth() {
  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.yjecfzhffignnakibjec',
    password: '@evolveai234$',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth';");
  console.log('Auth tables:', tables.rows.map(r => r.table_name));

  const triggers = await client.query("SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'auth';");
  console.log('Auth triggers:', triggers.rows);

  const schemaMigrations = await client.query("SELECT * FROM auth.schema_migrations;");
  console.log('Last schema migration in auth:', schemaMigrations.rows.slice(-3));

  await client.end();
}

checkAuth().catch(console.error);
