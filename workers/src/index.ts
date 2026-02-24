import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './lib/db'
import aiGateway from './routes/ai-gateway'
import lineWebhook from './routes/line-webhook'

type HonoEnv = { Bindings: Env }

const app = new Hono<HonoEnv>()

// CORS for dashboard frontend
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'https://ai-backoffice.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Mount routes
app.route('/', aiGateway)
app.route('/', lineWebhook)

// Direct domain API endpoints (for dashboard frontend)
import { neon } from '@neondatabase/serverless'
import { handleAccounting } from './routes/domain-accounting'
import { handleHR } from './routes/domain-hr'
import { handleCRM } from './routes/domain-crm'
import { handleDocuments } from './routes/domain-documents'
import { handleGeneral } from './routes/domain-general'

// Generic domain endpoint: POST /api/domain/:domain
app.post('/api/domain/:domain', async (c) => {
  const env = c.env
  const domain = c.req.param('domain')
  const sql = neon(env.DATABASE_URL)

  try {
    const body = await c.req.json()
    const { user_id, org_id, action, params } = body

    if (!user_id || !org_id || !action) {
      return c.json({ success: false, message: 'user_id, org_id, action は必須です' }, 400)
    }

    // Set RLS context
    await sql`SELECT set_config('app.current_user_id', ${user_id}, true)`

    let result: { message: string; data: any }
    switch (domain) {
      case 'accounting':
        result = await handleAccounting(sql, env, org_id, user_id, action, params || {})
        break
      case 'hr':
        result = await handleHR(sql, env, org_id, user_id, action, params || {})
        break
      case 'crm':
        result = await handleCRM(sql, env, org_id, user_id, action, params || {})
        break
      case 'documents':
        result = await handleDocuments(sql, env, org_id, user_id, action, params || {})
        break
      case 'general':
        result = await handleGeneral(sql, env, org_id, user_id, action, params || {})
        break
      default:
        return c.json({ success: false, message: `ドメイン「${domain}」は存在しません` }, 404)
    }

    return c.json({ success: true, ...result })

  } catch (err: any) {
    console.error(`Domain ${domain} error:`, err)
    return c.json({ success: false, message: err.message }, 500)
  }
})

export default app
