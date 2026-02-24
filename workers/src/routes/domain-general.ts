import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', timeZone: 'Asia/Tokyo' })
}

const requestTypeLabels: Record<string, string> = {
  supply: '🗂 消耗品', repair: '🔧 修理', visitor: '🏢 来客', other: '📝 その他'
}
const statusLabels: Record<string, string> = {
  open: '🔵 未対応', in_progress: '🟡 対応中', resolved: '🟢 完了', rejected: '🔴 却下'
}
const equipmentStatusLabels: Record<string, string> = {
  available: '🟢 利用可能', in_use: '🔵 使用中', maintenance: '🟡 メンテ中', retired: '⚫ 廃棄済み'
}

export async function handleGeneral(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'get_equipment': {
      const rows = await sql`
        SELECT id, name, category, location, status, assigned_to
        FROM equipment WHERE org_id = ${orgId}::uuid
        ORDER BY name LIMIT 50
      `

      // Category breakdown
      const categories = new Map<string, any[]>()
      rows.forEach((r: any) => {
        const cat = r.category || 'その他'
        if (!categories.has(cat)) categories.set(cat, [])
        categories.get(cat)!.push(r)
      })

      // Status summary
      const statusCounts = new Map<string, number>()
      rows.forEach((r: any) => {
        statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1)
      })

      let msg = `🖥 備品一覧\n━━━━━━━━━━━━━\n`
      msg += `総数: ${rows.length}件\n`

      // Status summary
      msg += `\n【ステータス】\n`
      statusCounts.forEach((count, status) => {
        msg += `  ${equipmentStatusLabels[status] || status}: ${count}件\n`
      })

      // By category
      msg += `\n【カテゴリ別】\n`
      categories.forEach((items, cat) => {
        msg += `\n📂 ${cat} (${items.length}件)\n`
        items.forEach((r: any) => {
          const st = equipmentStatusLabels[r.status]?.slice(0, 2) || '⚪'
          msg += `  ${st} ${r.name}\n`
          if (r.location) msg += `     📍 ${r.location}\n`
        })
      })

      return { message: msg, data: rows }
    }

    case 'register_equipment': {
      const { name, category, location } = params
      if (!name) return { message: '⚠️ 備品名は必須です\n\n例: 「備品登録 ノートPC 事務室」', data: null }

      const rows = await sql`
        INSERT INTO equipment (org_id, name, category, location, registered_by)
        VALUES (${orgId}::uuid, ${name}, ${category || null}, ${location || null}, ${userId}::uuid)
        RETURNING id, name, created_at
      `

      const totalEquipment = await sql`
        SELECT COUNT(*) as count FROM equipment WHERE org_id = ${orgId}::uuid
      `

      let msg = `✅ 備品を登録しました\n━━━━━━━━━━━━━\n`
      msg += `名称: ${name}\n`
      if (category) msg += `カテゴリ: ${category}\n`
      if (location) msg += `設置場所: 📍 ${location}\n`
      msg += `ステータス: 🟢 利用可能\n`
      msg += `\n総備品数: ${totalEquipment[0].count}件`

      return { message: msg, data: rows[0] }
    }

    case 'create_request': {
      const { type, description } = params
      if (!type || !description) return { message: '⚠️ 種別と内容は必須です\n\n例:\n「コピー用紙を発注して」→ 消耗品申請\n「会議室のプロジェクター修理」→ 修理申請', data: null }

      const rows = await sql`
        INSERT INTO office_requests (org_id, user_id, type, description)
        VALUES (${orgId}::uuid, ${userId}::uuid, ${type}::office_request_type, ${description})
        RETURNING id, type, status, created_at
      `

      // Count pending requests
      const pending = await sql`
        SELECT COUNT(*) as count FROM office_requests
        WHERE org_id = ${orgId}::uuid AND status = 'open'
      `

      const typeLabel = requestTypeLabels[type] || type

      let msg = `✅ 申請を作成しました\n━━━━━━━━━━━━━\n`
      msg += `種別: ${typeLabel}\n`
      msg += `内容: ${description}\n`
      msg += `ステータス: 🔵 未対応\n`
      msg += `申請日: ${fmtDate(rows[0].created_at)}\n`
      msg += `\n現在の未対応申請: ${pending[0].count}件`

      return { message: msg, data: rows[0] }
    }

    case 'get_requests': {
      const rows = await sql`
        SELECT r.id, r.type, r.description, r.status, r.created_at,
               u.full_name as requester
        FROM office_requests r
        LEFT JOIN user_profiles u ON r.user_id = u.id
        WHERE r.org_id = ${orgId}::uuid
        ORDER BY r.created_at DESC LIMIT 20
      `

      // Status breakdown
      const statusGroup = new Map<string, any[]>()
      rows.forEach((r: any) => {
        if (!statusGroup.has(r.status)) statusGroup.set(r.status, [])
        statusGroup.get(r.status)!.push(r)
      })

      let msg = `📋 庶務申請一覧\n━━━━━━━━━━━━━\n`
      msg += `総数: ${rows.length}件\n\n`

      // Status summary
      msg += `【ステータス別】\n`
      statusGroup.forEach((items, status) => {
        msg += `  ${statusLabels[status] || status}: ${items.length}件\n`
      })

      // Open requests first (priority)
      const openReqs = rows.filter((r: any) => r.status === 'open')
      if (openReqs.length > 0) {
        msg += `\n🔔 未対応（要対応）\n`
        openReqs.forEach((r: any, i: number) => {
          const typeLabel = requestTypeLabels[r.type]?.slice(0, 2) || '📝'
          msg += `${i + 1}. ${typeLabel} ${r.description}\n`
          msg += `   申請者: ${r.requester || '不明'} | ${fmtDate(r.created_at)}\n`
        })
      }

      // Recent resolved
      const resolved = rows.filter((r: any) => r.status === 'resolved').slice(0, 5)
      if (resolved.length > 0) {
        msg += `\n✅ 最近完了\n`
        resolved.forEach((r: any) => {
          msg += `  ✅ ${r.description} (${fmtDate(r.created_at)})\n`
        })
      }

      return { message: msg, data: rows }
    }

    case 'update_request_status': {
      const { request_id, status } = params
      if (!request_id || !status) return { message: '⚠️ 申請IDとステータスは必須です', data: null }

      const before = await sql`
        SELECT r.type, r.description, r.status as old_status, u.full_name as requester
        FROM office_requests r
        LEFT JOIN user_profiles u ON r.user_id = u.id
        WHERE r.id = ${request_id}::uuid AND r.org_id = ${orgId}::uuid
      `

      await sql`
        UPDATE office_requests SET status = ${status}::office_request_status
        WHERE id = ${request_id}::uuid AND org_id = ${orgId}::uuid
      `

      const req = before[0]
      const oldStatus = statusLabels[req?.old_status] || req?.old_status
      const newStatus = statusLabels[status] || status
      const typeLabel = requestTypeLabels[req?.type] || req?.type

      let msg = `✅ 申請ステータス更新\n━━━━━━━━━━━━━\n`
      msg += `種別: ${typeLabel}\n`
      msg += `内容: ${req?.description}\n`
      if (req?.requester) msg += `申請者: ${req.requester}\n\n`
      msg += `${oldStatus} → ${newStatus}`

      return { message: msg, data: { request_id, status } }
    }

    case 'send_notification': {
      const { title, body, user_id: targetUserId } = params
      if (!title) return { message: '⚠️ タイトルは必須です\n\n例: 「全員に通知 明日の会議は14時からです」', data: null }

      let recipientCount = 0
      if (targetUserId) {
        await sql`
          INSERT INTO notifications (org_id, user_id, title, body)
          VALUES (${orgId}::uuid, ${targetUserId}::uuid, ${title}, ${body || ''})
        `
        recipientCount = 1
      } else {
        const result = await sql`
          INSERT INTO notifications (org_id, user_id, title, body)
          SELECT ${orgId}::uuid, user_id, ${title}, ${body || ''}
          FROM org_members WHERE org_id = ${orgId}::uuid
          RETURNING id
        `
        recipientCount = result.length
      }

      let msg = `🔔 通知を送信しました\n━━━━━━━━━━━━━\n`
      msg += `タイトル: ${title}\n`
      if (body) msg += `内容: ${body}\n`
      msg += `送信先: ${targetUserId ? '指定ユーザー' : `全メンバー (${recipientCount}名)`}\n`

      return { message: msg, data: null }
    }

    default:
      return { message: `⚠️ 総務アクション「${action}」は未対応です`, data: null }
  }
}
