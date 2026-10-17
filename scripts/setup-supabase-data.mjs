import pg from 'pg';

const { Client } = pg;

async function setupSupabase() {
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

  // 1. Ensure Admin RLS policies
  console.log('Configuring Admin RLS policies...');
  await client.query(`
    -- Allow admins to view all profiles
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles"
      ON public.profiles FOR SELECT
      USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );

    -- Allow admins to view all earnings
    DROP POLICY IF EXISTS "Admins can view all earnings" ON public.earnings_records;
    CREATE POLICY "Admins can view all earnings"
      ON public.earnings_records FOR SELECT
      USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );

    -- Allow admins to view all complaints
    DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaint_drafts;
    CREATE POLICY "Admins can view all complaints"
      ON public.complaint_drafts FOR SELECT
      USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      );
  `);

  // 2. Helper to create or update an auth user safely
  async function upsertAuthUser(email, password, rawUserMeta, rawAppMeta) {
    const check = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    let userId;
    if (check.rows.length > 0) {
      userId = check.rows[0].id;
      console.log(`Updating existing auth user: ${email} (${userId})`);
      await client.query(`
        UPDATE auth.users
        SET 
          encrypted_password = crypt($1, gen_salt('bf', 10)),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          raw_user_meta_data = $2,
          raw_app_meta_data = $3,
          updated_at = NOW()
        WHERE id = $4;
      `, [password, JSON.stringify(rawUserMeta), JSON.stringify(rawAppMeta), userId]);
    } else {
      console.log(`Creating new auth user: ${email}`);
      const insert = await client.query(`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_user_meta_data,
          raw_app_meta_data,
          created_at,
          updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          $1,
          crypt($2, gen_salt('bf', 10)),
          NOW(),
          $3,
          $4,
          NOW(),
          NOW()
        ) RETURNING id;
      `, [email, password, JSON.stringify(rawUserMeta), JSON.stringify(rawAppMeta)]);
      userId = insert.rows[0].id;
    }

    // Upsert into auth.identities
    await client.query(`
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1::uuid,
        $2::jsonb,
        'email',
        $1::text,
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (provider, provider_id) DO UPDATE SET
        identity_data = EXCLUDED.identity_data,
        updated_at = NOW();
    `, [
      userId,
      JSON.stringify({ sub: userId, email, ...rawUserMeta })
    ]);

    // Upsert into public.profiles
    await client.query(`
      INSERT INTO public.profiles (id, full_name, phone_number, preferred_language, primary_platform, city, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        preferred_language = EXCLUDED.preferred_language,
        primary_platform = EXCLUDED.primary_platform,
        city = EXCLUDED.city,
        updated_at = NOW();
    `, [
      userId,
      rawUserMeta.full_name,
      rawUserMeta.phone_number || null,
      rawUserMeta.preferred_language || 'hi',
      rawUserMeta.primary_platform || 'All',
      rawUserMeta.city || 'India'
    ]);

    return userId;
  }

  // Create Admin
  const adminId = await upsertAuthUser(
    'admin@gigsaathi.in',
    'Admin@12345',
    {
      full_name: 'Super Admin Officer',
      phone_number: '+91 98765 00000',
      preferred_language: 'en',
      primary_platform: 'Administration',
      city: 'New Delhi'
    },
    { provider: 'email', providers: ['email'], role: 'admin' }
  );
  console.log('Admin ready:', adminId);

  // Create Standard Worker
  const workerId = await upsertAuthUser(
    'worker@gigsaathi.in',
    'Worker@12345',
    {
      full_name: 'Ramesh Delivery Saathi',
      phone_number: '+91 98112 34567',
      preferred_language: 'hi',
      primary_platform: 'Zomato',
      city: 'Bengaluru'
    },
    { provider: 'email', providers: ['email'], role: 'worker' }
  );
  console.log('Worker ready:', workerId);

  // Seed sample earnings into public.earnings_records for the worker
  console.log('Seeding earnings records into Supabase...');
  const sampleEarnings = [
    {
      work_date: '2026-10-16',
      platform: 'Zomato',
      description: 'Dinner peak rush + 14 orders completed in Indiranagar',
      gross_earnings: 1250,
      incentives: 350,
      fuel_expenses: 280,
      other_expenses: 60,
      platform_deductions: 50,
      hours_worked: 7.5
    },
    {
      work_date: '2026-10-15',
      platform: 'Swiggy',
      description: 'Lunch surge + rain allowance in Koramangala',
      gross_earnings: 980,
      incentives: 220,
      fuel_expenses: 210,
      other_expenses: 50,
      platform_deductions: 0,
      hours_worked: 6.0
    },
    {
      work_date: '2026-10-14',
      platform: 'Blinkit',
      description: 'Morning dark-store slot delivery',
      gross_earnings: 750,
      incentives: 100,
      fuel_expenses: 150,
      other_expenses: 30,
      platform_deductions: 100,
      hours_worked: 5.0
    },
    {
      work_date: '2026-10-13',
      platform: 'Uber',
      description: 'Airport rides and city drops',
      gross_earnings: 2100,
      incentives: 400,
      fuel_expenses: 650,
      other_expenses: 120,
      platform_deductions: 380,
      hours_worked: 9.0
    }
  ];

  for (const item of sampleEarnings) {
    await client.query(`
      INSERT INTO public.earnings_records (
        user_id, work_date, platform, description,
        gross_earnings, incentives, fuel_expenses, other_expenses,
        platform_deductions, hours_worked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT DO NOTHING;
    `, [
      workerId, item.work_date, item.platform, item.description,
      item.gross_earnings, item.incentives, item.fuel_expenses, item.other_expenses,
      item.platform_deductions, item.hours_worked
    ]);
  }

  // Seed sample complaint draft into public.complaint_drafts
  console.log('Seeding complaint drafts into Supabase...');
  await client.query(`
    INSERT INTO public.complaint_drafts (
      user_id, title, platform_or_employer, incident_date,
      amount_disputed, recipient_category, subject, formal_letter,
      facts_summary, legal_fairness_basis, requested_relief, supporting_evidence,
      language, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) ON CONFLICT DO NOTHING;
  `, [
    workerId,
    'Disputed Heavy Rain Delay Penalty - Zomato',
    'Zomato India',
    '2026-10-12',
    500,
    'Company Grievance Cell',
    'Formal Request for Immediate Reversal of Unfair ₹500 Delivery Penalty during Severe Weather Conditions',
    'Respected Sir/Madam, I am submitting this formal grievance regarding an unfair penalty of ₹500 imposed during heavy rain in Bengaluru on 12th October 2026...',
    JSON.stringify(['Delayed due to urban flooding in Bengaluru', 'Customer informed via in-app chat']),
    JSON.stringify(['Doctrine of Force Majeure', 'State Motor Vehicle Safety guidelines']),
    JSON.stringify(['Full refund of ₹500 deduction', 'Restoration of reliability score']),
    JSON.stringify(['Screenshot of deduction notification', 'Weather alert advisory']),
    'en',
    'draft'
  ]);

  // Count verify
  const profileCount = await client.query('SELECT count(*) FROM public.profiles');
  const earningsCount = await client.query('SELECT count(*) FROM public.earnings_records');
  const complaintCount = await client.query('SELECT count(*) FROM public.complaint_drafts');

  console.log('✅ Supabase setup complete!');
  console.log(`Profiles: ${profileCount.rows[0].count}`);
  console.log(`Earnings Records: ${earningsCount.rows[0].count}`);
  console.log(`Complaint Drafts: ${complaintCount.rows[0].count}`);

  await client.end();
}

setupSupabase().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
