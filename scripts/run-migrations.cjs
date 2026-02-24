const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_EZ6c7OsUdeLg@ep-broad-haze-aikcuhdv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Neon database');

  try {
    // Step 0: Create auth compatibility layer for Neon (Supabase auth.users / auth.uid() equivalent)
    console.log('\n=== Step 0: Creating auth compatibility layer ===');
    await client.query(`
      -- Create auth schema (Supabase compatibility)
      CREATE SCHEMA IF NOT EXISTS auth;

      -- Create auth.users table (minimal Supabase-compatible)
      CREATE TABLE IF NOT EXISTS auth.users (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email           text UNIQUE,
        encrypted_password text,
        raw_app_meta_data  jsonb DEFAULT '{}'::jsonb,
        raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now()
      );

      -- Create auth.uid() function
      -- Returns the current user's UUID from the app.current_user_id session variable
      -- This is set by the API layer (Cloudflare Workers) before executing queries
      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS $$
        SELECT COALESCE(
          nullif(current_setting('app.current_user_id', true), '')::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid
        );
      $$;
    `);
    console.log('Auth compatibility layer created');

    // Step 1: Run 001_initial_schema.sql
    console.log('\n=== Step 1: Running 001_initial_schema.sql ===');
    const migration001 = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );
    await client.query(migration001);
    console.log('001_initial_schema.sql completed');

    // Step 2: Run 002_line_users.sql
    console.log('\n=== Step 2: Running 002_line_users.sql ===');
    const migration002 = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '002_line_users.sql'),
      'utf-8'
    );
    await client.query(migration002);
    console.log('002_line_users.sql completed');

    // Step 3: Verify tables
    console.log('\n=== Step 3: Verifying tables ===');
    const result = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'auth')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `);
    console.log('\nCreated tables:');
    result.rows.forEach(r => console.log(`  ${r.table_schema}.${r.table_name}`));
    console.log(`\nTotal: ${result.rows.length} tables`);

    // Verify enums
    const enums = await client.query(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname;
    `);
    console.log('\nCreated enums:');
    enums.rows.forEach(r => console.log(`  ${r.typname}`));
    console.log(`\nTotal: ${enums.rows.length} enums`);

    // Verify RLS
    const rls = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = true
      ORDER BY tablename;
    `);
    console.log('\nTables with RLS enabled:');
    rls.rows.forEach(r => console.log(`  ${r.tablename}`));
    console.log(`\nTotal: ${rls.rows.length} tables with RLS`);

    console.log('\n=== All migrations completed successfully! ===');

  } catch (err) {
    console.error('Migration failed:', err.message);
    if (err.position) {
      console.error('Error position:', err.position);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
