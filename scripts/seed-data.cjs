const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_EZ6c7OsUdeLg@ep-broad-haze-aikcuhdv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Neon');

  try {
    // ============================================
    // 1. Create test users in auth.users
    // ============================================
    console.log('\n=== Creating auth users ===');
    await client.query(`
      INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
        ('11111111-1111-1111-1111-111111111111', 'ceo@demotech.co.jp', '{"full_name": "山田太郎"}'::jsonb),
        ('22222222-2222-2222-2222-222222222222', 'manager@demotech.co.jp', '{"full_name": "佐藤花子"}'::jsonb),
        ('33333333-3333-3333-3333-333333333333', 'tanaka@demotech.co.jp', '{"full_name": "田中一郎"}'::jsonb),
        ('44444444-4444-4444-4444-444444444444', 'suzuki@demotech.co.jp', '{"full_name": "鈴木美咲"}'::jsonb),
        ('55555555-5555-5555-5555-555555555555', 'takahashi@demotech.co.jp', '{"full_name": "高橋健太"}'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('5 users created');

    // ============================================
    // 2. Create organization
    // ============================================
    console.log('\n=== Creating organization ===');
    await client.query(`
      INSERT INTO orgs (id, name, plan) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '株式会社デモテック', 'pro')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Organization created');

    // ============================================
    // 3. Add members with roles & permissions
    // ============================================
    console.log('\n=== Adding org members ===');
    await client.query(`
      INSERT INTO org_members (org_id, user_id, role, permissions) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', '{"accounting":"rw","hr":"rw","crm":"rw","documents":"rw","general_affairs":"rw"}'::jsonb),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'admin', '{"accounting":"rw","hr":"rw","crm":"rw","documents":"rw","general_affairs":"rw"}'::jsonb),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member', '{"accounting":"r","hr":"r","crm":"rw","documents":"r","general_affairs":"r"}'::jsonb),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'member', '{"accounting":"none","hr":"r","crm":"r","documents":"rw","general_affairs":"rw"}'::jsonb),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'member', '{"accounting":"none","hr":"r","crm":"none","documents":"r","general_affairs":"r"}'::jsonb)
      ON CONFLICT (org_id, user_id) DO NOTHING;
    `);
    console.log('5 members added');

    // ============================================
    // 4. User profiles
    // ============================================
    console.log('\n=== Creating user profiles ===');
    await client.query(`
      INSERT INTO user_profiles (id, full_name, email, phone) VALUES
        ('11111111-1111-1111-1111-111111111111', '山田太郎', 'ceo@demotech.co.jp', '090-1111-1111'),
        ('22222222-2222-2222-2222-222222222222', '佐藤花子', 'manager@demotech.co.jp', '090-2222-2222'),
        ('33333333-3333-3333-3333-333333333333', '田中一郎', 'tanaka@demotech.co.jp', '090-3333-3333'),
        ('44444444-4444-4444-4444-444444444444', '鈴木美咲', 'suzuki@demotech.co.jp', '090-4444-4444'),
        ('55555555-5555-5555-5555-555555555555', '高橋健太', 'takahashi@demotech.co.jp', '090-5555-5555')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('5 profiles created');

    // ============================================
    // 5. Employees (HR domain)
    // ============================================
    console.log('\n=== Creating employees ===');
    await client.query(`
      INSERT INTO employees (id, org_id, user_id, employee_number, department, position, hire_date, salary_monthly, paid_leave_total, paid_leave_used) VALUES
        ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'EMP001', '経営', '代表取締役', '2020-04-01', 800000, 20, 3),
        ('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'EMP002', '管理部', '部長', '2021-04-01', 500000, 20, 5),
        ('e3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'EMP003', '営業部', '主任', '2022-04-01', 350000, 20, 8),
        ('e4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'EMP004', '管理部', '担当', '2023-04-01', 280000, 20, 2),
        ('e5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'EMP005', '営業部', '担当', '2024-01-15', 250000, 15, 1)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('5 employees created');

    // ============================================
    // 6. Accounts (Chart of accounts)
    // ============================================
    console.log('\n=== Creating chart of accounts ===');
    await client.query(`
      INSERT INTO accounts (org_id, code, name, type) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1000', '現金', 'asset'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1100', '普通預金', 'asset'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1200', '売掛金', 'asset'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2000', '買掛金', 'liability'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2100', '未払金', 'liability'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '3000', '資本金', 'equity'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4000', '売上高', 'revenue'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '4100', 'サービス売上', 'revenue'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5000', '仕入高', 'expense'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5100', '給与手当', 'expense'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5200', '交通費', 'expense'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5300', '通信費', 'expense'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5400', '消耗品費', 'expense'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5500', '地代家賃', 'expense')
      ON CONFLICT (org_id, code) DO NOTHING;
    `);
    console.log('14 accounts created');

    // ============================================
    // 7. Contacts (CRM domain)
    // ============================================
    console.log('\n=== Creating contacts ===');
    await client.query(`
      INSERT INTO contacts (id, org_id, company_name, contact_name, email, phone, tags) VALUES
        ('c1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '株式会社ABC商事', '中村太郎', 'nakamura@abc.co.jp', '03-1111-1111', ARRAY['既存顧客', 'IT']),
        ('c2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '有限会社山本建設', '山本健一', 'yamamoto@yk.co.jp', '03-2222-2222', ARRAY['見込み', '建設']),
        ('c3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '合同会社ネクスト', '伊藤美穂', 'ito@next.co.jp', '03-3333-3333', ARRAY['既存顧客', 'コンサル']),
        ('c4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '株式会社グリーンファーム', '小林裕子', 'kobayashi@gf.co.jp', '03-4444-4444', ARRAY['見込み', '農業']),
        ('c5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '株式会社テクノソリューション', '渡辺誠', 'watanabe@techsol.co.jp', '03-5555-5555', ARRAY['新規', 'IT'])
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('5 contacts created');

    // ============================================
    // 8. Deals (CRM domain)
    // ============================================
    console.log('\n=== Creating deals ===');
    await client.query(`
      INSERT INTO deals (org_id, contact_id, title, amount, stage, assigned_to, expected_close_date) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-1111-1111-1111-111111111111', 'ABC商事 システム開発案件', 5000000, 'negotiation', '33333333-3333-3333-3333-333333333333', '2026-03-31'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-2222-2222-2222-222222222222', '山本建設 DX導入支援', 2000000, 'proposal', '33333333-3333-3333-3333-333333333333', '2026-04-15'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-3333-3333-3333-333333333333', 'ネクスト コンサル契約更新', 1200000, 'closed_won', '22222222-2222-2222-2222-222222222222', '2026-02-28'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-4444-4444-4444-444444444444', 'グリーンファーム IoT案件', 3000000, 'lead', '55555555-5555-5555-5555-555555555555', '2026-06-30'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c5555555-5555-5555-5555-555555555555', 'テクノソリューション 共同開発', 8000000, 'proposal', '33333333-3333-3333-3333-333333333333', '2026-05-31')
      ON CONFLICT DO NOTHING;
    `);
    console.log('5 deals created');

    // ============================================
    // 9. Invoices
    // ============================================
    console.log('\n=== Creating invoices ===');
    await client.query(`
      INSERT INTO invoices (org_id, contact_id, type, amount, tax_amount, status, due_date) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-1111-1111-1111-111111111111', 'receivable', 500000, 50000, 'paid', '2026-01-31'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-3333-3333-3333-333333333333', 'receivable', 1200000, 120000, 'paid', '2026-02-28'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-1111-1111-1111-111111111111', 'receivable', 800000, 80000, 'sent', '2026-03-31'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c5555555-5555-5555-5555-555555555555', 'receivable', 300000, 30000, 'draft', '2026-04-15'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'payable', 150000, 15000, 'paid', '2026-02-15'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'payable', 250000, 25000, 'sent', '2026-03-15')
      ON CONFLICT DO NOTHING;
    `);
    console.log('6 invoices created');

    // ============================================
    // 10. Expenses
    // ============================================
    console.log('\n=== Creating expenses ===');
    await client.query(`
      INSERT INTO expenses (org_id, user_id, category, amount, tax_amount, description, status) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '交通費', 1200, 120, '新宿→渋谷 電車', 'approved'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '交通費', 4500, 450, '東京→横浜 往復', 'approved'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', '消耗品費', 3200, 320, 'USBメモリ', 'approved'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '会議費', 8500, 850, 'クライアント打合せランチ', 'pending'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '通信費', 12000, 1200, 'モバイルWi-Fiレンタル', 'pending'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '交通費', 2800, 280, '品川→新橋 タクシー', 'approved')
      ON CONFLICT DO NOTHING;
    `);
    console.log('6 expenses created');

    // ============================================
    // 11. Attendance records
    // ============================================
    console.log('\n=== Creating attendance records ===');
    const today = new Date();
    for (let d = 1; d <= 5; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

      const dateStr = date.toISOString().slice(0, 10);
      const employees = [
        ['e1111111-1111-1111-1111-111111111111', 9, 0, 18, 30],
        ['e2222222-2222-2222-2222-222222222222', 8, 30, 19, 0],
        ['e3333333-3333-3333-3333-333333333333', 9, 15, 20, 0],
        ['e4444444-4444-4444-4444-444444444444', 9, 0, 17, 30],
        ['e5555555-5555-5555-5555-555555555555', 10, 0, 19, 30],
      ];

      for (const [empId, inH, inM, outH, outM] of employees) {
        const clockIn = `${dateStr}T${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00+09:00`;
        const clockOut = `${dateStr}T${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}:00+09:00`;
        const workedMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        const breakMin = workedMinutes > 360 ? 60 : 0;
        const overtime = Math.max(0, (workedMinutes - breakMin) - 480);

        await client.query(`
          INSERT INTO attendance (org_id, employee_id, date, clock_in, clock_out, break_minutes, overtime_minutes, type)
          VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', $1::uuid, $2::date, $3::timestamptz, $4::timestamptz, $5, $6, 'normal')
          ON CONFLICT (employee_id, date) DO NOTHING
        `, [empId, dateStr, clockIn, clockOut, breakMin, overtime]);
      }
    }
    console.log('Attendance records created');

    // ============================================
    // 12. Documents & Templates
    // ============================================
    console.log('\n=== Creating documents ===');
    await client.query(`
      INSERT INTO documents (org_id, title, category, content, created_by) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '就業規則 v3.0', 'regulation', '第1条 この規則は、株式会社デモテックの就業に関する事項を定める。\n第2条 勤務時間は午前9時から午後6時とし、休憩時間は正午から午後1時とする。\n第3条 時間外労働は月45時間を上限とする。', '11111111-1111-1111-1111-111111111111'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '情報セキュリティポリシー', 'manual', '1. パスワードは12文字以上とする\n2. 社外秘文書の持ち出し禁止\n3. 個人端末での業務データアクセス禁止\n4. インシデント発生時は即時報告', '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '取引先契約書ひな型', 'contract', '業務委託契約書\n\n甲：{{甲の名称}}\n乙：株式会社デモテック\n\n第1条（目的）本契約は...', '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '見積書テンプレート使用マニュアル', 'manual', '見積書の作成手順：\n1. テンプレートを選択\n2. 顧客名・日付を入力\n3. 明細を記入\n4. 上長の承認を得てから送付', '44444444-4444-4444-4444-444444444444')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO templates (org_id, name, category, content_template, variables) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '見積書', 'estimate', '御見積書\n\n宛先: {{顧客名}} 御中\n日付: {{日付}}\n\n件名: {{件名}}\n金額: ¥{{金額}}\n\n備考: {{備考}}', '["顧客名","日付","件名","金額","備考"]'::jsonb),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '議事録', 'other', '議事録\n\n日時: {{日時}}\n場所: {{場所}}\n出席者: {{出席者}}\n\n議題:\n{{議題}}\n\n決定事項:\n{{決定事項}}\n\n次回アクション:\n{{アクション}}', '["日時","場所","出席者","議題","決定事項","アクション"]'::jsonb),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '業務委託契約書', 'contract', '業務委託契約書\n\n甲: {{発注者名}}\n乙: 株式会社デモテック\n\n第1条（業務内容）\n{{業務内容}}\n\n第2条（委託料）\n¥{{金額}}\n\n第3条（期間）\n{{開始日}} ～ {{終了日}}', '["発注者名","業務内容","金額","開始日","終了日"]'::jsonb)
      ON CONFLICT DO NOTHING;
    `);
    console.log('4 documents + 3 templates created');

    // ============================================
    // 13. Equipment (General Affairs)
    // ============================================
    console.log('\n=== Creating equipment ===');
    await client.query(`
      INSERT INTO equipment (org_id, name, category, location, status, assigned_to, registered_by) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MacBook Pro 14" M3', 'PC', '3F オフィス', 'in_use', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dell U2723QE モニター', 'モニター', '3F オフィス', 'in_use', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EPSON EW-M873T プリンター', 'プリンター', '2F 共有スペース', 'in_use', null, '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'iPhone 15 Pro (営業用)', 'スマートフォン', '貸出中', 'in_use', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '会議室プロジェクター', 'プロジェクター', '4F 会議室A', 'available', null, '22222222-2222-2222-2222-222222222222'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ThinkPad X1 Carbon (予備)', 'PC', '2F 倉庫', 'available', null, '22222222-2222-2222-2222-222222222222')
      ON CONFLICT DO NOTHING;
    `);
    console.log('6 equipment items created');

    // ============================================
    // 14. Office Requests
    // ============================================
    console.log('\n=== Creating office requests ===');
    await client.query(`
      INSERT INTO office_requests (org_id, user_id, type, description, status) VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'supply', 'A4コピー用紙 5箱', 'completed'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'repair', '3F トイレの蛇口水漏れ', 'in_progress'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'visitor', '3/1 14:00 テクノソリューション渡辺様 来社', 'approved'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'supply', 'ホワイトボードマーカー 赤青黒各3本', 'pending')
      ON CONFLICT DO NOTHING;
    `);
    console.log('4 office requests created');

    // ============================================
    // Verify all data
    // ============================================
    console.log('\n=== Verification ===');
    const tables = [
      'auth.users', 'orgs', 'org_members', 'user_profiles', 'employees',
      'accounts', 'invoices', 'expenses', 'contacts', 'deals',
      'attendance', 'documents', 'templates', 'equipment', 'office_requests'
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n=== Seed data inserted successfully! ===');
    console.log('\nTest users:');
    console.log('  CEO:     11111111-1111-1111-1111-111111111111 (owner, all permissions)');
    console.log('  Manager: 22222222-2222-2222-2222-222222222222 (admin, all permissions)');
    console.log('  Tanaka:  33333333-3333-3333-3333-333333333333 (member, crm=rw, others=r)');
    console.log('  Suzuki:  44444444-4444-4444-4444-444444444444 (member, docs+general=rw)');
    console.log('  Takahashi: 55555555-5555-5555-5555-555555555555 (member, minimal)');
    console.log('\nOrg ID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
