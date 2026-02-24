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

// HMAC-SHA256 signature verification
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return expected === signature
}

// LINE Reply API
async function replyToLine(replyToken: string, message: string, accessToken: string) {
  // Split long messages (LINE limit: 5000 chars)
  const text = message.length > 4900 ? message.slice(0, 4900) + '...' : message

  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })
}

app.post('/api/line-webhook', async (c) => {
  const env = c.env

  // Verify LINE signature
  const rawBody = await c.req.text()
  const signature = c.req.header('x-line-signature') || ''

  if (env.LINE_CHANNEL_SECRET) {
    const valid = await verifySignature(rawBody, signature, env.LINE_CHANNEL_SECRET)
    if (!valid) {
      return c.json({ error: 'Invalid signature' }, 401)
    }
  }

  const body = JSON.parse(rawBody)
  const events = body.events || []

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue

    const lineUserId = event.source.userId
    const messageText = event.message.text
    const replyToken = event.replyToken

    try {
      const sql = neon(env.DATABASE_URL)

      // Look up LINE user → system user mapping
      const lineUsers = await sql`
        SELECT user_id, org_id, display_name FROM line_users
        WHERE line_user_id = ${lineUserId}
      `

      if (lineUsers.length === 0) {
        await replyToLine(replyToken,
          '未登録のLINEアカウントです。\n\nダッシュボードからLINE連携を設定してください。\nhttps://app.ai-backoffice.jp/settings/line',
          env.LINE_CHANNEL_ACCESS_TOKEN)
        continue
      }

      const { user_id, org_id } = lineUsers[0]

      // Quick shortcuts
      if (messageText === '出勤' || messageText === '出勤します') {
        await sql`SELECT set_config('app.current_user_id', ${user_id}, true)`
        const result = await handleHR(sql, env, org_id, user_id, 'clock_in', {})
        await replyToLine(replyToken, result.message, env.LINE_CHANNEL_ACCESS_TOKEN)
        continue
      }

      if (messageText === '退勤' || messageText === '退勤します') {
        await sql`SELECT set_config('app.current_user_id', ${user_id}, true)`
        const result = await handleHR(sql, env, org_id, user_id, 'clock_out', {})
        await replyToLine(replyToken, result.message, env.LINE_CHANNEL_ACCESS_TOKEN)
        continue
      }

      // AI intent classification → domain routing
      const intent = await classifyIntent(env, messageText)

      if (intent.domain === 'unknown') {
        await replyToLine(replyToken,
          'ご要望を理解できませんでした。\n\n使い方の例:\n・「出勤」「退勤」\n・「今月の売上」\n・「交通費1200円」\n・「有給残日数」\n・「顧客一覧」',
          env.LINE_CHANNEL_ACCESS_TOKEN)
        continue
      }

      // Check permissions
      const members = await sql`
        SELECT role, permissions FROM org_members
        WHERE org_id = ${org_id}::uuid AND user_id = ${user_id}::uuid
      `
      if (members.length === 0) {
        await replyToLine(replyToken, '組織へのアクセス権がありません', env.LINE_CHANNEL_ACCESS_TOKEN)
        continue
      }

      // Set user context and execute
      await sql`SELECT set_config('app.current_user_id', ${user_id}, true)`

      let result: { message: string; data: any }
      switch (intent.domain) {
        case 'accounting':
          result = await handleAccounting(sql, env, org_id, user_id, intent.action, intent.params)
          break
        case 'hr':
          result = await handleHR(sql, env, org_id, user_id, intent.action, intent.params)
          break
        case 'crm':
          result = await handleCRM(sql, env, org_id, user_id, intent.action, intent.params)
          break
        case 'documents':
          result = await handleDocuments(sql, env, org_id, user_id, intent.action, intent.params)
          break
        case 'general':
          result = await handleGeneral(sql, env, org_id, user_id, intent.action, intent.params)
          break
        default:
          result = { message: `「${intent.domain}」は現在対応していません`, data: null }
      }

      // Audit log
      try {
        await sql`
          INSERT INTO ai_logs (org_id, user_id, domain, intent, action, request_body, response_body)
          VALUES (${org_id}::uuid, ${user_id}::uuid, ${intent.domain}, ${intent.action}, ${intent.action},
                  ${JSON.stringify({ source: 'line', message: messageText })}::jsonb,
                  ${JSON.stringify(result)}::jsonb)
        `
      } catch (e) { /* log failure is non-fatal */ }

      await replyToLine(replyToken, result.message, env.LINE_CHANNEL_ACCESS_TOKEN)

    } catch (err: any) {
      console.error('LINE webhook error:', err)
      await replyToLine(replyToken, `エラーが発生しました。しばらく経ってからお試しください。`, env.LINE_CHANNEL_ACCESS_TOKEN)
    }
  }

  return c.json({ status: 'ok' })
})

export default app
