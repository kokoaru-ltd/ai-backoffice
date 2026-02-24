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

// LINE Reply API
async function replyToLine(replyToken: string, message: string, accessToken: string) {
  const text = message.length > 4900 ? message.slice(0, 4900) + '...' : message
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
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
    console.log('LINE reply status:', res.status)
  } catch (e: any) {
    console.error('LINE reply error:', e.message)
  }
}

// LINE Push API (for async responses)
async function pushToLine(userId: string, message: string, accessToken: string) {
  const text = message.length > 4900 ? message.slice(0, 4900) + '...' : message
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text }],
      }),
    })
    console.log('LINE push status:', res.status)
  } catch (e: any) {
    console.error('LINE push error:', e.message)
  }
}

// Process a single event
async function processEvent(event: any, env: Env) {
  if (event.type !== 'message' || event.message.type !== 'text') return

  const lineUserId = event.source.userId
  const messageText = event.message.text
  const replyToken = event.replyToken

  console.log('Processing:', lineUserId, messageText)

  try {
    const sql = neon(env.DATABASE_URL)

    // Look up LINE user
    const lineUsers = await sql`
      SELECT user_id, org_id, display_name FROM line_users
      WHERE line_user_id = ${lineUserId}
    `

    if (lineUsers.length === 0) {
      await replyToLine(replyToken,
        `未登録のLINEアカウントです。\n\nあなたのLINE User ID:\n${lineUserId}`,
        env.LINE_CHANNEL_ACCESS_TOKEN)
      return
    }

    const { user_id, org_id } = lineUsers[0]

    // Quick shortcuts (no AI classification needed)
    if (messageText === '出勤' || messageText === '出勤します') {
      const result = await handleHR(sql, env, org_id, user_id, 'clock_in', {})
      await replyToLine(replyToken, result.message, env.LINE_CHANNEL_ACCESS_TOKEN)
      return
    }

    if (messageText === '退勤' || messageText === '退勤します') {
      const result = await handleHR(sql, env, org_id, user_id, 'clock_out', {})
      await replyToLine(replyToken, result.message, env.LINE_CHANNEL_ACCESS_TOKEN)
      return
    }

    // For AI classification: reply immediately, then process and push
    await replyToLine(replyToken, '処理中...', env.LINE_CHANNEL_ACCESS_TOKEN)

    // AI intent classification
    console.log('Classifying intent...')
    const intent = await classifyIntent(env, messageText)
    console.log('Intent:', JSON.stringify(intent))

    if (intent.domain === 'unknown') {
      await pushToLine(lineUserId,
        'ご要望を理解できませんでした。\n\n使い方の例:\n・「出勤」「退勤」\n・「今月の売上」\n・「交通費1200円」\n・「有給残日数」\n・「顧客一覧」',
        env.LINE_CHANNEL_ACCESS_TOKEN)
      return
    }

    // Execute domain handler
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

    console.log('Result:', result.message)
    await pushToLine(lineUserId, result.message, env.LINE_CHANNEL_ACCESS_TOKEN)

    // Audit log
    try {
      await sql`
        INSERT INTO ai_logs (org_id, user_id, domain, intent, action, request_body, response_body)
        VALUES (${org_id}::uuid, ${user_id}::uuid, ${intent.domain}, ${intent.action}, ${intent.action},
                ${JSON.stringify({ source: 'line', message: messageText })}::jsonb,
                ${JSON.stringify(result)}::jsonb)
      `
    } catch (e) { console.error('Audit log error:', e) }

  } catch (err: any) {
    console.error('Processing error:', err.message)
    await pushToLine(lineUserId, `エラー: ${err.message}`, env.LINE_CHANNEL_ACCESS_TOKEN)
  }
}

app.post('/api/line-webhook', async (c) => {
  const env = c.env
  console.log('=== WEBHOOK HIT ===')

  let body: any
  try {
    const rawBody = await c.req.text()
    body = JSON.parse(rawBody)
  } catch (e) {
    return c.json({ status: 'ok' })
  }

  const events = body.events || []
  if (events.length === 0) {
    return c.json({ status: 'ok' })
  }

  // Process events in background using waitUntil
  // This returns 200 to LINE immediately and keeps worker alive
  c.executionCtx.waitUntil(
    Promise.all(events.map((event: any) => processEvent(event, env)))
  )

  // Return immediately to LINE
  return c.json({ status: 'ok' })
})

export default app
