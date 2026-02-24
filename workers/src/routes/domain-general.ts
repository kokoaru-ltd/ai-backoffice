import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

export async function handleGeneral(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'get_equipment': {
      const rows = await sql`
        SELECT id, name, category, location, status, assigned_to
        FROM equipment WHERE org_id = ${orgId}::uuid
        ORDER BY name LIMIT 50
      `
      return { message: `備品一覧: ${rows.length}件`, data: rows }
    }

    case 'register_equipment': {
      const { name, category, location } = params
      if (!name) return { message: '備品名は必須です', data: null }

      const rows = await sql`
        INSERT INTO equipment (org_id, name, category, location, registered_by)
        VALUES (${orgId}::uuid, ${name}, ${category || null}, ${location || null}, ${userId}::uuid)
        RETURNING id, name
      `
      return { message: `備品「${name}」を登録しました`, data: rows[0] }
    }

    case 'create_request': {
      const { type, description } = params
      if (!type || !description) return { message: '種別と内容は必須です', data: null }

      const rows = await sql`
        INSERT INTO office_requests (org_id, user_id, type, description)
        VALUES (${orgId}::uuid, ${userId}::uuid, ${type}::office_request_type, ${description})
        RETURNING id, type, status
      `
      const typeLabels: Record<string, string> = {
        supply: '消耗品', repair: '修理', visitor: '来客', other: 'その他'
      }
      return { message: `${typeLabels[type] || type}申請を作成しました`, data: rows[0] }
    }

    case 'get_requests': {
      const rows = await sql`
        SELECT id, type, description, status, created_at
        FROM office_requests WHERE org_id = ${orgId}::uuid
        ORDER BY created_at DESC LIMIT 20
      `
      return { message: `庶務申請一覧: ${rows.length}件`, data: rows }
    }

    case 'update_request_status': {
      const { request_id, status } = params
      if (!request_id || !status) return { message: '申請IDとステータスは必須です', data: null }

      await sql`
        UPDATE office_requests SET status = ${status}::office_request_status
        WHERE id = ${request_id}::uuid AND org_id = ${orgId}::uuid
      `
      return { message: `申請ステータスを更新しました`, data: { request_id, status } }
    }

    case 'send_notification': {
      const { title, body, user_id: targetUserId } = params
      if (!title) return { message: 'タイトルは必須です', data: null }

      if (targetUserId) {
        await sql`
          INSERT INTO notifications (org_id, user_id, title, body)
          VALUES (${orgId}::uuid, ${targetUserId}::uuid, ${title}, ${body || ''})
        `
      } else {
        // Send to all org members
        await sql`
          INSERT INTO notifications (org_id, user_id, title, body)
          SELECT ${orgId}::uuid, user_id, ${title}, ${body || ''}
          FROM org_members WHERE org_id = ${orgId}::uuid
        `
      }
      return { message: `通知「${title}」を送信しました`, data: null }
    }

    default:
      return { message: `総務アクション「${action}」は未対応です`, data: null }
  }
}
