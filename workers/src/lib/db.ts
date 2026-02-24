import { neon } from '@neondatabase/serverless'

export type Env = {
  DATABASE_URL: string
  ANTHROPIC_API_KEY: string
  LINE_CHANNEL_SECRET: string
  LINE_CHANNEL_ACCESS_TOKEN: string
}

export function getDb(env: Env) {
  return neon(env.DATABASE_URL)
}

// Execute a query with the user context set for RLS
export async function queryAsUser(env: Env, userId: string, sqlFn: (sql: ReturnType<typeof neon>) => Promise<any>) {
  const sql = neon(env.DATABASE_URL)
  // Set the app.current_user_id for auth.uid() in RLS policies
  await sql`SELECT set_config('app.current_user_id', ${userId}, true)`
  return sqlFn(sql)
}
