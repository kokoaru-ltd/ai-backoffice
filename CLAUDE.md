# AI BackOffice - AI統合バックオフィスプラットフォーム

## プロジェクト概要

AI BackOfficeは、中小企業（5〜50人規模）向けのAI統合バックオフィスプラットフォームである。
1つのAIエージェントが会計・労務・CRM・文書管理・総務の全業務を処理し、従業員はLINEやSlackから自然言語で業務操作を行う。管理職向けにはWebダッシュボード（閲覧専用）を提供する。

### コンセプト

**「20人の会社が、バックオフィス0人で、50人の会社と同じ業務品質で回る」**

- AIは権限を持たない。要求者の権限を継承して処理するだけ
- 社員が行うのは人間にしかできないこと（物理的な入力：レシート撮影、出退勤打刻の意思表示など）のみ
- 全AI操作は監査ログに記録され、透明性と追跡可能性を担保する

### 解決する課題

- バックオフィス人員の採用難・人件費の圧迫
- 経理・労務・総務の業務が属人化しブラックボックス化
- 複数SaaSの乱立による情報分散・学習コスト増大
- 紙・Excel依存による非効率な業務プロセス

### アーキテクチャ思想

- **ドメイン完全分離**: 会計/労務/CRM/文書/総務はそれぞれ独立したAPI・独立したテーブル群
- **AIゲートウェイパターン**: 自然言語 → 意図解析 → ドメインルーティング → 権限チェック → 実行
- **権限継承モデル**: AIは要求者のロール・ドメイン権限に基づいて動作する
- **監査ファースト**: 全操作を `ai_logs` テーブルに記録

---

## 技術スタック

### フロントエンド
- **React 19** + **TypeScript** 5.9
- **Vite 7**（ビルドツール）
- **React Router 7**（クライアントサイドルーティング）
- **Tailwind CSS 4**
- **Recharts 3**（チャート・グラフ）
- **Lucide React**（アイコン）

### バックエンド
- **Supabase**（PostgreSQL + Auth + Edge Functions + Storage）
- **Deno Edge Functions**（サーバーレスAPI）
- **Row-Level Security (RLS)** による細粒度アクセス制御

### AI
- **Claude API** (claude-sonnet-4-20250514) — 意図分類・自然言語処理
- **OpenAI API** — テキストEmbeddings生成（RAG用、text-embedding-3-small / 1536次元）

### メッセージング
- **LINE Messaging API** — 従業員向けチャットUI

### データベース拡張
- **pgcrypto** — UUID生成
- **pgvector** — ベクトル検索（RAG / セマンティック検索）

---

## データベース構造

合計 **23テーブル** を5ドメイン + 共通基盤に分離。

### 共通テーブル（6テーブル）

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| `orgs` | 組織 | id, name, plan, created_at |
| `org_members` | 組織メンバー（複合PK: org_id + user_id） | org_id, user_id, role, permissions(jsonb), created_at |
| `user_profiles` | ユーザープロファイル | id(=auth.users.id), full_name, email, phone, avatar_url |
| `ai_logs` | AI操作監査ログ | id, org_id, user_id, domain, intent, action, request_body, response_body, created_at |
| `approval_requests` | 承認リクエスト | id, org_id, requester_id, approver_id, domain, type, data, status, threshold_amount, approved_at |
| `notifications` | 通知 | id, org_id, user_id, title, body, read, created_at |
| `line_users` | LINE連携ユーザー | line_user_id(PK), user_id, org_id, display_name, registered_at |

### 会計ドメイン（4テーブル）

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| `accounts` | 勘定科目 | id, org_id, code, name, type(asset/liability/equity/revenue/expense) |
| `journals` | 仕訳帳 | id, org_id, date, description, entries(jsonb), created_by, approved_by |
| `invoices` | 請求書（売掛・買掛） | id, org_id, contact_id, type(receivable/payable), amount, tax_amount, status, due_date, pdf_url |
| `expenses` | 経費 | id, org_id, user_id, category, amount, tax_amount, description, receipt_url, status, approved_by |

### 労務ドメイン（3テーブル）

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| `employees` | 従業員マスタ | id, org_id, user_id, employee_number, department, position, hire_date, salary_monthly, paid_leave_total, paid_leave_used |
| `attendance` | 勤怠記録 | id, org_id, employee_id, date, clock_in, clock_out, break_minutes, overtime_minutes, type |
| `payroll` | 給与明細 | id, org_id, employee_id, period, base_salary, overtime_pay, deductions(jsonb), net_pay, paid_at |

### CRMドメイン（4テーブル）

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| `contacts` | 顧客・取引先 | id, org_id, company_name, contact_name, email, phone, address, tags(text[]), notes |
| `deals` | 商談 | id, org_id, contact_id, title, amount, stage, assigned_to, expected_close_date |
| `interactions` | 対応履歴 | id, org_id, contact_id, deal_id, type(call/email/meeting/note), summary, details, created_by |
| `teleapo_calls` | テレアポ記録 | id, org_id, contact_id, caller, status, duration_seconds, transcript, result, next_action, scheduled_at, completed_at |

### 文書ドメイン（3テーブル）

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| `documents` | 文書 | id, org_id, title, category, content, file_url, version, created_by |
| `doc_embeddings` | 文書ベクトル（RAG） | id, document_id, chunk_index, content, embedding(vector(1536)) |
| `templates` | 文書テンプレート | id, org_id, name, category, content_template, variables(jsonb) |

### 総務ドメイン（2テーブル）

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| `equipment` | 備品管理 | id, org_id, name, category, location, status, assigned_to, photo_url, registered_by |
| `office_requests` | 総務リクエスト | id, org_id, user_id, type(supply/repair/visitor/other), description, status |

### 定義済みENUM

| ENUM名 | 値 |
|---------|-----|
| `org_role` | owner, admin, member |
| `approval_status` | pending, approved, rejected, auto_approved |
| `account_type` | asset, liability, equity, revenue, expense |
| `invoice_type` | receivable, payable |
| `invoice_status` | draft, sent, paid, overdue |
| `expense_status` | pending, approved, rejected |
| `attendance_type` | normal, paid_leave, sick_leave, absence |
| `deal_stage` | lead, proposal, negotiation, closed_won, closed_lost |
| `interaction_type` | call, email, meeting, note |
| `teleapo_call_status` | scheduled, calling, completed, no_answer, callback |
| `document_category` | contract, estimate, invoice, regulation, manual, other |
| `equipment_status` | in_use, available, maintenance, disposed |
| `office_request_type` | supply, repair, visitor, other |
| `office_request_status` | pending, approved, in_progress, completed |

### RLSヘルパー関数

| 関数名 | 引数 | 説明 |
|--------|------|------|
| `is_org_member(_org_id)` | uuid | ユーザーが指定orgのメンバーか |
| `has_domain_permission(_org_id, _domain)` | uuid, text | ドメインの閲覧権限（r or rw）があるか |
| `has_domain_write_permission(_org_id, _domain)` | uuid, text | ドメインの書き込み権限（rw）があるか |
| `my_employee_id(_org_id)` | uuid | 現在のユーザーのemployee_idを取得 |

---

## Edge Functions一覧

### ai-gateway（中央ルーティング）

AIの中核。自然言語メッセージを受け取り、意図分類 → 権限チェック → ドメインルーティング → 実行 → 監査ログ記録を行う。

**エンドポイント**: `POST /functions/v1/ai-gateway`

**リクエスト**:
```json
{
  "user_id": "uuid",
  "org_id": "uuid (optional)",
  "message": "今月の売上教えて",
  "source": "line | slack | web"
}
```

**処理フロー**:
1. ユーザーコンテキスト解決（org_members, user_profiles, employees）
2. Claude APIで意図分類（ドメイン、意図、操作、パラメータ）
3. マルチドメインリクエストの場合は並列処理
4. 権限チェック（ロール + ドメイン別permissions）
5. ドメインハンドラ実行（直接DB or ドメインFunction呼び出し）
6. `ai_logs` テーブルに監査ログ記録
7. レスポンス返却

### line-webhook（LINE Bot）

LINE Messaging APIのWebhookを受信し、ai-gatewayに中継する。

**エンドポイント**: `POST /functions/v1/line-webhook`

**機能**:
- HMAC-SHA256署名検証
- `line_users` テーブルでユーザー照合
- 未登録ユーザーには登録案内メッセージを返却
- テキストメッセージ → ai-gateway中継
- 画像メッセージ → Supabase Storageに保存 → 経費申請コンテキストでai-gatewayに中継
- クイックショートカット: 「出勤」「退勤」をワンワードで処理
- フォローイベントでウェルカムメッセージ送信

### domain-accounting（会計ドメイン — 8アクション）

| アクション | 操作 | 説明 |
|-----------|------|------|
| `getRevenue` | read | 売上集計（期間指定、入金済/未入金別） |
| `getExpenses` | read | 経費一覧（期間・カテゴリ・ステータスフィルタ） |
| `createExpense` | write | 経費申請作成 |
| `createInvoice` | write | 請求書作成 |
| `createJournal` | write | 仕訳作成（借方・貸方バランスチェック付き） |
| `getPL` | read | 損益計算書生成（勘定科目別集計） |
| `getBS` | read | 貸借対照表生成（資産/負債/資本の残高集計） |
| `approveExpense` | write | 経費承認 |

### domain-hr（労務ドメイン — 8アクション）

| アクション | 操作 | 説明 |
|-----------|------|------|
| `clockIn` | write | 出勤打刻（重複チェック付き） |
| `clockOut` | write | 退勤打刻（残業自動計算、休憩時間自動付与） |
| `getAttendance` | read | 勤怠一覧（期間・従業員フィルタ） |
| `requestLeave` | write | 有休申請（残日数チェック付き） |
| `getLeaveBalance` | read | 有休残日数確認 |
| `getOvertime` | read | 残業時間集計 |
| `getPayroll` | read | 給与明細取得 |
| `calculatePayroll` | write | 給与計算（基本給 + 残業代 - 控除） |

**定数**:
- 36協定上限: 月45時間（`OVERTIME_MONTHLY_LIMIT_MINUTES = 2700`）
- 標準労働時間: 1日8時間（`STANDARD_WORK_MINUTES = 480`）
- 休憩付与閾値: 6時間超で60分休憩自動付与

### domain-crm（CRMドメイン — 9アクション）

| アクション | 操作 | 説明 |
|-----------|------|------|
| `getContacts` | read | 顧客一覧（テキスト検索・タグフィルタ） |
| `createContact` | write | 顧客登録 |
| `getDeals` | read | 商談一覧（ステージ・担当者フィルタ） |
| `createDeal` | write | 商談作成（初期ステージ: lead） |
| `updateDealStage` | write | 商談ステージ更新 |
| `logInteraction` | write | 対応履歴記録（電話/メール/ミーティング/メモ） |
| `getSalesReport` | read | 営業レポート生成（ステージ別・担当者別集計） |
| `scheduleTeleapo` | write | テレアポ予約 |
| `getTeleapoSchedule` | read | テレアポ予定確認 |

**商談ステージ遷移**:
```
lead → proposal → negotiation → closed_won
                              → closed_lost
```

**ステージ日本語ラベル**: リード / 提案中 / 商談中 / 受注 / 失注

### domain-documents（文書ドメイン — 6アクション）

| アクション | 操作 | 説明 |
|-----------|------|------|
| `searchDocuments` | read | テキスト検索（title, content ILIKE） |
| `ragSearch` | read | セマンティック検索（pgvector + OpenAI Embeddings） |
| `getDocument` | read | 文書取得（ID or タイトル検索） |
| `createDocument` | write | 文書作成 + 自動Embedding生成 |
| `getTemplates` | read | テンプレート一覧 |
| `generateFromTemplate` | write | テンプレートから文書生成（変数置換） |

**RAG検索の仕組み**:
1. ユーザーのクエリをOpenAI Embeddings APIで1536次元ベクトルに変換
2. `doc_embeddings` テーブルに対してHNSWインデックスを使ったコサイン類似度検索
3. 上位結果のチャンク内容を返却

### domain-general（総務ドメイン — 6アクション）

| アクション | 操作 | 説明 |
|-----------|------|------|
| `getEquipment` | read | 備品一覧（ステータス・カテゴリフィルタ） |
| `registerEquipment` | write | 備品登録 |
| `createRequest` | write | 総務リクエスト作成（消耗品/修理/来客/その他） |
| `getRequests` | read | リクエスト一覧 |
| `updateRequestStatus` | write | リクエストステータス更新 |
| `sendNotification` | write | 通知送信 |

---

## 権限モデル

### ロール定義

| ロール | 説明 |
|--------|------|
| `owner` | 組織オーナー。全ドメイン全操作のフルアクセス |
| `admin` | 管理者。全ドメイン全操作のフルアクセス |
| `member` | 一般メンバー。ドメイン別にR/RW/none権限を付与 |

### ドメイン権限（memberロールのみ適用）

`org_members.permissions` カラム（JSONB）で管理:

```json
{
  "accounting": "r",
  "hr": "rw",
  "crm": "rw",
  "documents": "r",
  "general_affairs": "rw"
}
```

| 権限値 | 意味 |
|--------|------|
| `"rw"` | 読み取り + 書き込み |
| `"r"` | 読み取りのみ |
| `"none"` / 未設定 | アクセス不可 |

### 権限マトリクス

| ドメイン | owner | admin | member (rw) | member (r) | member (none) |
|----------|-------|-------|-------------|------------|---------------|
| **会計** 閲覧 | OK | OK | OK | OK | NG |
| **会計** 書込 | OK | OK | OK | NG | NG |
| **労務** 閲覧 | OK | OK | OK | OK（自分の勤怠・給与のみ） | 自分の勤怠・給与のみ |
| **労務** 書込 | OK | OK | OK | NG | 自分の出退勤打刻のみ |
| **CRM** 閲覧 | OK | OK | OK | OK | NG |
| **CRM** 書込 | OK | OK | OK | NG | NG |
| **文書** 閲覧 | OK | OK | OK | OK | NG |
| **文書** 書込 | OK | OK | OK | NG | NG |
| **総務** 閲覧 | OK | OK | OK | OK（自分のリクエストのみ） | 自分のリクエストのみ |
| **総務** 書込 | OK | OK | OK | NG | 自分のリクエスト作成のみ |

### 特殊RLSルール

- **経費**: 全メンバーが自分の経費を作成・閲覧可能。会計権限があれば全員分閲覧・承認可能
- **勤怠**: 全従業員が自分の出退勤を打刻・閲覧可能。HR権限があれば全員分閲覧・管理可能
- **給与**: 自分の給与明細のみ閲覧可能。HR権限があれば全員分閲覧・計算可能
- **総務リクエスト**: 全メンバーが自分のリクエストを作成・閲覧可能。総務権限があれば全件管理可能

---

## 承認フロー設計

### 自動承認

金額が閾値以下の定型処理は自動承認する。

| 対象 | 閾値 | 条件 |
|------|------|------|
| 経費申請 | 5,000円以下 | カテゴリが交通費・消耗品 |
| 総務リクエスト（消耗品） | 3,000円以下 | 消耗品カテゴリ |

### バッチ承認

定型承認をまとめて処理する。管理者に「5件の経費申請があります。全部OK？」と提示。

### 個別承認

以下のケースは個別承認フローを経由:
- 閾値超えの経費申請
- 仕訳の作成・修正
- 従業員情報の変更
- 例外的なオフィスリクエスト

### approval_requestsテーブルのステータス遷移

```
pending → approved    (承認者がapprove)
        → rejected    (承認者がreject)
        → auto_approved (閾値以下で自動承認)
```

---

## AIの意図分類

ai-gatewayがClaude APIを使って自然言語メッセージをドメイン・意図・操作に分類する。

### 会計（accounting）

| 意図 | 操作 | 対応パラメータ |
|------|------|---------------|
| `get_revenue` | read | period |
| `get_expenses` | read | period, category?, status? |
| `create_expense` | write | category, amount, description |
| `get_invoices` | read | type?(receivable/payable), status? |
| `create_invoice` | write | contact_id?, amount, type |
| `create_journal` | write | date, description, entries |
| `get_pl` | read | period |
| `get_bs` | read | date |
| `approve_expense` | write | expense_id |

### 労務（hr）

| 意図 | 操作 | 対応パラメータ |
|------|------|---------------|
| `clock_in` | write | （なし） |
| `clock_out` | write | （なし） |
| `get_attendance` | read | employee_name?, period? |
| `request_leave` | write | date, type |
| `get_payroll` | read | period? |
| `get_overtime` | read | employee_name?, period? |
| `get_leave_balance` | read | employee_name? |
| `get_employees` | read | department? |

### CRM（crm）

| 意図 | 操作 | 対応パラメータ |
|------|------|---------------|
| `get_contacts` | read | search?, tags? |
| `create_contact` | write | company_name, contact_name, email?, phone?, ... |
| `get_deals` | read | stage?, assigned_to? |
| `create_deal` | write | contact_id, title, amount |
| `update_deal_stage` | write | deal_id, stage |
| `log_interaction` | write | contact_id, type, summary |
| `get_teleapo_schedule` | read | date? |
| `schedule_teleapo` | write | contact_id, scheduled_at |

### 文書（documents）

| 意図 | 操作 | 対応パラメータ |
|------|------|---------------|
| `search_documents` | read | query |
| `get_document` | read | document_id? title? |
| `create_document` | write | title, category, content |
| `get_templates` | read | category? |
| `generate_from_template` | write | template_id, variables |
| `rag_search` | read | query |

### 総務（general）

| 意図 | 操作 | 対応パラメータ |
|------|------|---------------|
| `get_equipment` | read | status?, category? |
| `register_equipment` | write | name, category, location |
| `create_request` | write | type, description |
| `get_requests` | read | status?, type? |
| `update_request_status` | write | request_id, status |
| `chitchat` | read | （雑談・挨拶） |

### マルチドメイン（multi）

複数ドメインにまたがる質問（例:「売上と山田の残業教えて」）の場合:
- `domain: "multi"`
- `sub_requests` に各ドメインのリクエストを配列で格納
- 権限チェック後、許可されたサブリクエストを並列実行

### 意図分類のヒント（AIへの指示）

| キーワード群 | ドメイン |
|-------------|---------|
| いくら、売上、経費、請求書、仕訳 | accounting |
| 出勤、退勤、休み、残業、給与 | hr |
| お客さん、商談、テレアポ、取引先 | crm |
| 契約書、見積書、テンプレ、規程、マニュアル | documents |
| 備品、消耗品、修理、来客 | general |
| 上記に当てはまらない雑談・挨拶 | general (chitchat) |

### パラメータ抽出ルール

- 日付・期間: 「今月」「先月」「2025年1月」→ ISO形式 "YYYY-MM" に変換
- 人名: 「山田さん」「田中」→ `employee_name` に抽出
- 金額: 「5万円」「100,000円」→ 数値に変換
- 曖昧な場合: parameters に null を設定し、confidence を下げる

---

## ユーザーフロー例

### 社長（owner）のLINE操作例

```
社長: 今月の売上どのくらい？
AI: 売上合計: ¥12,500,000（入金済: ¥8,200,000）、15件の請求書

社長: 山田の今月の残業時間は？
AI: 残業合計: 12時間30分（22日分）

社長: 来月の商談パイプライン見せて
AI: 商談: 8件、合計金額: ¥45,000,000
    - リード: 3件（¥15,000,000）
    - 提案中: 2件（¥12,000,000）
    - 商談中: 3件（¥18,000,000）

社長: 売上と経費と商談状況をまとめて教えて
AI: 【accounting】売上合計: ¥12,500,000（入金済: ¥8,200,000）
    【accounting】経費合計: ¥3,200,000、42件
    【crm】商談: 8件、合計金額: ¥45,000,000
```

### 部長（admin / CRM担当）のLINE操作例

```
部長: 山田商事の連絡先教えて
AI: 顧客: 1件（「山田商事」で検索）
    山田商事 / 山田太郎
    電話: 03-1234-5678
    メール: yamada@example.com

部長: A社との商談をクローズにして
AI: 商談「A社 システム導入案件」のステージを「受注」に更新しました

部長: 今日のテレアポ予定は？
AI: テレアポ予定: 5件
    14:00 - B社（佐藤様）
    14:30 - C社（鈴木様）
    ...
```

### 社員（member / 限定権限）のLINE操作例

```
社員: 出勤
AI: 出勤打刻しました（09:02:15）

社員: 退勤
AI: 退勤打刻しました（18:35:22）。勤務時間: 8時間33分（うち残業: 0時間33分）

社員: タクシー代3,200円経費申請
AI: 経費申請を作成しました（¥3,200、カテゴリ: 交通費）

社員: 有休の残り何日？
AI: 有休残日数: 15日（付与: 20日、使用済: 5日）

社員: 今月の売上は？
AI: 会計ドメインの閲覧権限がありません。管理者に権限の付与を依頼してください。
```

---

## Webダッシュボード

管理職向けの閲覧専用Webダッシュボード。

### ルート構成

| パス | ページ | 説明 |
|------|--------|------|
| `/login` | Login | ログインページ |
| `/` | Dashboard | 概要ダッシュボード（KPI、月次売上チャート、直近操作ログ） |
| `/accounting` | Accounting | 会計（PL、経費一覧、請求書一覧） |
| `/hr` | HR | 労務（勤怠一覧、有休残高、給与概要） |
| `/crm` | CRM | CRM（商談パイプライン、顧客一覧、テレアポ予定） |
| `/documents` | Documents | 文書管理（文書一覧、テンプレート一覧） |
| `/general` | General | 総務（備品一覧、リクエスト一覧） |
| `/audit` | AuditLog | 監査ログ（全AI操作の時系列ログ） |
| `/*` | — | 未定義パスは `/` にリダイレクト |

### 共通コンポーネント

| コンポーネント | ファイル | 説明 |
|---------------|----------|------|
| `Layout` | `src/components/Layout.tsx` | サイドバーナビゲーション + ヘッダー |
| `StatCard` | `src/components/StatCard.tsx` | KPIカード（数値 + ラベル + アイコン） |
| `StatusBadge` | `src/components/StatusBadge.tsx` | ステータス表示バッジ |

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# TypeScriptビルド + Viteビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# ESLint
npm run lint

# Edge Function デプロイ（個別）
npx supabase functions deploy ai-gateway
npx supabase functions deploy line-webhook
npx supabase functions deploy domain-accounting
npx supabase functions deploy domain-hr
npx supabase functions deploy domain-crm
npx supabase functions deploy domain-documents
npx supabase functions deploy domain-general

# マイグレーション適用
npx supabase db push
```

---

## 環境変数

### フロントエンド（`.env` / Vite）

| 変数名 | 説明 |
|--------|------|
| `VITE_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonキー（公開用） |

### Edge Functions（Supabase Secrets）

| 変数名 | 説明 |
|--------|------|
| `SUPABASE_URL` | SupabaseプロジェクトのURL（自動設定） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Roleキー（RLSバイパス用） |
| `ANTHROPIC_API_KEY` | Claude API キー（意図分類・自然言語処理用） |
| `LINE_CHANNEL_SECRET` | LINE Messaging APIのチャネルシークレット（署名検証用） |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging APIのチャネルアクセストークン |
| `OPENAI_API_KEY` | OpenAI APIキー（Embeddings生成用、text-embedding-3-small） |

---

## プロジェクト構造

```
ai-backoffice/
├── CLAUDE.md                          # このファイル
├── package.json                       # 依存関係（React 19, Vite 7, Tailwind 4, Recharts 3）
├── vite.config.ts                     # Vite設定（React + Tailwind プラグイン）
├── tsconfig.json                      # TypeScript設定
├── index.html                         # エントリーHTML
├── src/
│   ├── main.tsx                       # Reactエントリーポイント
│   ├── App.tsx                        # ルーティング定義
│   ├── index.css                      # グローバルCSS（Tailwind）
│   ├── types/
│   │   └── index.ts                   # 全TypeScript型定義
│   ├── lib/
│   │   ├── supabase.ts               # Supabaseクライアント初期化
│   │   └── mockData.ts               # 開発用モックデータ
│   ├── hooks/
│   │   └── useAuth.ts                # 認証フック
│   ├── components/
│   │   ├── Layout.tsx                 # 共通レイアウト（サイドバー + ヘッダー）
│   │   ├── StatCard.tsx               # KPIカードコンポーネント
│   │   └── StatusBadge.tsx            # ステータスバッジコンポーネント
│   └── pages/
│       ├── Login.tsx                  # ログインページ
│       ├── Dashboard.tsx              # 概要ダッシュボード
│       ├── Accounting.tsx             # 会計ページ
│       ├── HR.tsx                     # 労務ページ
│       ├── CRM.tsx                    # CRMページ
│       ├── Documents.tsx              # 文書管理ページ
│       ├── General.tsx                # 総務ページ
│       └── AuditLog.tsx              # 監査ログページ
└── supabase/
    ├── config.toml                    # Supabaseローカル設定
    ├── migrations/
    │   ├── 001_initial_schema.sql     # 初期スキーマ（22テーブル + RLS + インデックス）
    │   └── 002_line_users.sql         # LINE連携テーブル追加
    └── functions/
        ├── ai-gateway/
        │   └── index.ts               # AI中央ゲートウェイ（意図分類 + ドメインルーティング）
        ├── line-webhook/
        │   └── index.ts               # LINE Webhook処理
        ├── domain-accounting/
        │   └── index.ts               # 会計ドメインAPI（8アクション）
        ├── domain-hr/
        │   └── index.ts               # 労務ドメインAPI（8アクション）
        ├── domain-crm/
        │   └── index.ts               # CRMドメインAPI（9アクション）
        ├── domain-documents/
        │   └── index.ts               # 文書ドメインAPI（6アクション）
        └── domain-general/
            └── index.ts               # 総務ドメインAPI（6アクション）
```

---

## 注意事項

### org_membersテーブル

- `id` カラムは存在しない（複合PK: `org_id` + `user_id`）
- RLSポリシーが厳密に設定されているため、Edge Functionでは `service_role_key` で操作する

### 権限チェックの実装箇所

- **RLSレベル**: PostgreSQLのポリシーで行レベルアクセス制御（Supabase anon clientからのアクセス時）
- **Edge Functionレベル**: ai-gatewayの `checkPermission()` 関数でドメイン権限を事前チェック
- 二重チェック設計だが、Edge Functionは `service_role_key`（RLSバイパス）で動作するため、**Edge Function内の権限チェックが本番の防衛線**

### LINE連携

- `line_users` テーブルで LINE user ID ↔ Supabase user ID のマッピングを管理
- 1ユーザー1組織につき1LINEアカウントの制約（`idx_line_users_user_org` ユニーク制約）
- 未連携ユーザーからのメッセージには登録案内を自動返信

### 勤怠の自動計算

- 6時間超勤務で60分休憩を自動付与
- 8時間超（休憩差引後）の分を残業時間として自動計算
- 36協定上限（月45時間）の管理は `domain-hr` で実装

### ベクトル検索（RAG）

- Embeddingsモデル: OpenAI `text-embedding-3-small`（1536次元）
- インデックス: HNSW（`m=16, ef_construction=64`）、コサイン類似度
- 文書作成時に自動でチャンク分割 + Embedding生成

---

## 作業ルール

### 自動コミット・プッシュ
- **機能追加・修正が完了したら必ずコミット＆プッシュする（言われなくても）**
- コミットメッセージは日本語でOK
- プッシュ失敗時は手動プッシュコマンドを提示

### Edge Functionデプロイ
- Edge Function修正後は `npx supabase functions deploy <function_name>` を実行
- 複数関数の場合はまとめてデプロイ

### コード変更の鉄則
- **「コード変えるな」と言われたら絶対に変えるな**。文面だけ出せと言われたら文面だけ出せ
- ユーザーの指示を正確に理解してから動け。曖昧なら聞き返せ
- 動いてたものを壊すな。変更前に影響範囲を考えろ
