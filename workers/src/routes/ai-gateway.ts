import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'
import { classifyIntent } from '../lib/ai'
import { handleAccounting } from './domain-accounting'
import { handleHR } from './domain-hr'
import { handleCRM } from './domain-crm'
import { handleDocuments } from './domain-documents'
import { handleGeneral } from './domain-general'

type HonoEnv = { Bindings: Env }

const app = new Hono<HonoEnv>()

// Domain permission check
const DOMAIN_MAP: Record<string, string> = {
  accounting: 'accounting',
  hr: 'hr',
  crm: 'crm',
  documents: 'documents',
  general: 'general_affairs',
}

app.post('/api/ai-gateway', async (c) => {
  const env = c.env
  const sql = neon(env.DATABASE_URL)

  try {
    const body = await c.req.json()
    const { user_id, message, org_id } = body

    if (!user_id || !message) {
      return c.json({ success: false, message: 'user_id と message は必須です' }, 400)
    }

    // 1. Resolve user context
    let resolvedOrgId = org_id
    if (!resolvedOrgId) {
      const orgs = await sql`
        SELECT org_id, role, permissions FROM org_members
        WHERE user_id = ${user_id}::uuid LIMIT 1
      `
      if (orgs.length === 0) {
        return c.json({ success: false, message: '組織に所属していません' }, 403)
      }
      resolvedOrgId = orgs[0].org_id
    }

    // Get member info
    const members = await sql`
      SELECT role, permissions FROM org_members
      WHERE org_id = ${resolvedOrgId}::uuid AND user_id = ${user_id}::uuid
    `
    if (members.length === 0) {
      return c.json({ success: false, message: 'この組織へのアクセス権がありません' }, 403)
    }

    const member = members[0]
    const role = member.role
    const permissions = member.permissions || {}

    // 2. Classify intent
    const intent = await classifyIntent(env, message)

    if (intent.domain === 'unknown') {
      // Log and return friendly message
      await logAiAction(sql, resolvedOrgId, user_id, 'unknown', 'unknown', message, { error: 'unclassified' })
      return c.json({
        success: true,
        message: 'すみません、ご要望を理解できませんでした。もう少し具体的に教えてください。\n\n例:\n- 「今月の売上を教えて」\n- 「出勤」\n- 「交通費1,200円を申請」\n- 「顧客一覧」',
        data: null
      })
    }

    // 3. Check domain permission
    const domainKey = DOMAIN_MAP[intent.domain]
    if (domainKey) {
      const hasAccess = role === 'owner' || role === 'admin' ||
        (permissions[domainKey] && permissions[domainKey] !== 'none')

      // Special case: HR actions that users can do for themselves
      const selfServiceActions = ['clock_in', 'clock_out', 'get_attendance', 'request_leave', 'get_leave_balance', 'get_overtime', 'get_payroll']
      const isSelfService = intent.domain === 'hr' && selfServiceActions.includes(intent.action)

      // Special case: expense submission (any member can submit their own)
      const isExpenseSubmit = intent.domain === 'accounting' && intent.action === 'create_expense'

      if (!hasAccess && !isSelfService && !isExpenseSubmit) {
        await logAiAction(sql, resolvedOrgId, user_id, intent.domain, intent.action, message, { error: 'permission_denied' })
        return c.json({
          success: false,
          message: `${intent.domain}ドメインへのアクセス権がありません。管理者にお問い合わせください。`,
          data: null
        })
      }
    }

    // 4. Route to domain handler
    let result: { message: string; data: any }

    // Set user context for RLS
    await sql`SELECT set_config('app.current_user_id', ${user_id}, true)`

    switch (intent.domain) {
      case 'accounting':
        result = await handleAccounting(sql, env, resolvedOrgId, user_id, intent.action, intent.params)
        break
      case 'hr':
        result = await handleHR(sql, env, resolvedOrgId, user_id, intent.action, intent.params)
        break
      case 'crm':
        result = await handleCRM(sql, env, resolvedOrgId, user_id, intent.action, intent.params)
        break
      case 'documents':
        result = await handleDocuments(sql, env, resolvedOrgId, user_id, intent.action, intent.params)
        break
      case 'general':
        result = await handleGeneral(sql, env, resolvedOrgId, user_id, intent.action, intent.params)
        break
      default:
        result = { message: `ドメイン「${intent.domain}」は未対応です`, data: null }
    }

    // 5. Audit log
    await logAiAction(sql, resolvedOrgId, user_id, intent.domain, intent.action, message, result)

    return c.json({ success: true, ...result, intent })

  } catch (err: any) {
    console.error('AI Gateway error:', err)
    return c.json({ success: false, message: `エラーが発生しました: ${err.message}` }, 500)
  }
})

async function logAiAction(
  sql: ReturnType<typeof neon>,
  orgId: string, userId: string, domain: string, action: string,
  request: any, response: any
) {
  try {
    await sql`
      INSERT INTO ai_logs (org_id, user_id, domain, intent, action, request_body, response_body)
      VALUES (${orgId}::uuid, ${userId}::uuid, ${domain}, ${action}, ${action},
              ${JSON.stringify({ message: request })}::jsonb,
              ${JSON.stringify(response)}::jsonb)
    `
  } catch (e) {
    console.error('Failed to log AI action:', e)
  }
}

export default app
