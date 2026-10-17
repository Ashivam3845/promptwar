import pg from 'pg';
const { Client } = pg;

async function fix() {
  const client = new Client({
    host: 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.yjecfzhffignnakibjec',
    password: '@evolveai234$',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('Fixing NULL string columns in auth.users (phone stays null)...');
  await client.query(`
    UPDATE auth.users
    SET 
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      phone = NULL
    WHERE email IN ('admin@gigsaathi.in', 'worker@gigsaathi.in');
  `);
  console.log('Updated auth.users successfully!');

  const check = await client.query("SELECT email, confirmation_token, recovery_token, email_change, phone FROM auth.users;");
  console.log('Users:', check.rows);

  await client.end();
}

fix().catch(console.error);
