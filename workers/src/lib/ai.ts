import Anthropic from '@anthropic-ai/sdk'
import type { Env } from './db'

export type IntentResult = {
  domain: string
  action: string
  params: Record<string, any>
  confidence: number
}

const SYSTEM_PROMPT = `あなたはAIバックオフィスアシスタントです。ユーザーのメッセージを分析し、適切なドメインとアクションに分類してください。

## ドメインとアクション一覧

### accounting（経理・会計）
- get_revenue: 売上照会（params: period?）
- get_expenses: 経費一覧（params: period?, category?）
- create_expense: 経費申請（params: category, amount, description）
- create_invoice: 請求書作成（params: contact_name, amount, due_date）
- create_journal: 仕訳作成（params: date, description, entries[]）
- get_pl: 損益計算書（params: period?）
- get_bs: 貸借対照表（params: date?）
- approve_expense: 経費承認（params: expense_id）

### hr（人事・労務）
- clock_in: 出勤打刻（params: なし）
- clock_out: 退勤打刻（params: なし）
- get_attendance: 勤怠照会（params: period?, employee_id?）
- request_leave: 有給申請（params: date, type?）
- get_leave_balance: 有給残日数（params: なし）
- get_overtime: 残業時間照会（params: period?）
- get_payroll: 給与明細（params: period?）
- calculate_payroll: 給与計算（params: period）

### crm（顧客管理）
- get_contacts: 顧客一覧（params: search?）
- create_contact: 顧客登録（params: company_name?, contact_name, email?, phone?）
- get_deals: 商談一覧（params: stage?）
- create_deal: 商談作成（params: title, contact_id?, amount?）
- update_deal_stage: 商談ステージ更新（params: deal_id, stage）
- log_interaction: 対応記録（params: contact_id, type, summary）
- get_sales_report: 売上レポート（params: period?）
- schedule_teleapo: テレアポスケジュール（params: contact_id, scheduled_at）
- get_teleapo_schedule: テレアポ予定（params: date?）

### documents（文書管理）
- search_documents: 文書検索（params: query）
- rag_search: AI文書検索（params: query）
- get_document: 文書取得（params: document_id）
- create_document: 文書作成（params: title, category, content）
- get_templates: テンプレート一覧（params: category?）
- generate_from_template: テンプレート生成（params: template_id, variables）

### general（総務）
- get_equipment: 備品一覧（params: status?, category?）
- register_equipment: 備品登録（params: name, category?, location?）
- create_request: 庶務申請（params: type, description）
- get_requests: 申請一覧（params: status?）
- update_request_status: 申請ステータス更新（params: request_id, status）
- send_notification: 通知送信（params: user_id?, title, body）

## 出力形式
JSON形式で以下を返してください：
{
  "domain": "ドメイン名",
  "action": "アクション名",
  "params": { パラメータ },
  "confidence": 0.0-1.0
}

分類できない場合：
{
  "domain": "unknown",
  "action": "unknown",
  "params": {},
  "confidence": 0.0
}
`

export async function classifyIntent(env: Env, message: string): Promise<IntentResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0]) as IntentResult
  } catch {
    return { domain: 'unknown', action: 'unknown', params: {}, confidence: 0 }
  }
}
