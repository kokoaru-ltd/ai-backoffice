-- ============================================================================
-- AI Back Office Platform for SMBs - Initial Schema
-- Migration: 001_initial_schema.sql
--
-- Domains: Shared, Accounting, HR, CRM, Documents, General Affairs
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Shared enums
create type org_role as enum ('owner', 'admin', 'member');
create type approval_status as enum ('pending', 'approved', 'rejected', 'auto_approved');

-- Accounting enums
create type account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense');
create type invoice_type as enum ('receivable', 'payable');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
create type expense_status as enum ('pending', 'approved', 'rejected');

-- HR enums
create type attendance_type as enum ('normal', 'paid_leave', 'sick_leave', 'absence');

-- CRM enums
create type deal_stage as enum ('lead', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
create type interaction_type as enum ('call', 'email', 'meeting', 'note');
create type teleapo_call_status as enum ('scheduled', 'calling', 'completed', 'no_answer', 'callback');

-- Documents enums
create type document_category as enum ('contract', 'estimate', 'invoice', 'regulation', 'manual', 'other');

-- General Affairs enums
create type equipment_status as enum ('in_use', 'available', 'maintenance', 'disposed');
create type office_request_type as enum ('supply', 'repair', 'visitor', 'other');
create type office_request_status as enum ('pending', 'approved', 'in_progress', 'completed');


-- ============================================================================
-- SHARED / COMMON TABLES
-- ============================================================================

-- Organizations
create table orgs (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    plan        text not null default 'free',
    created_at  timestamptz not null default now()
);

-- Organization members (composite primary key)
create table org_members (
    org_id      uuid not null references orgs(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    role        org_role not null default 'member',
    permissions jsonb not null default '{}'::jsonb,
    created_at  timestamptz not null default now(),
    primary key (org_id, user_id)
);

-- User profiles
create table user_profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    full_name   text,
    email       text,
    phone       text,
    avatar_url  text
);

-- AI audit log
create table ai_logs (
    id              uuid primary key default gen_random_uuid(),
    org_id          uuid not null references orgs(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    domain          text not null,
    intent          text not null,
    action          text not null,
    request_body    jsonb,
    response_body   jsonb,
    created_at      timestamptz not null default now()
);

-- Approval requests
create table approval_requests (
    id                  uuid primary key default gen_random_uuid(),
    org_id              uuid not null references orgs(id) on delete cascade,
    requester_id        uuid not null references auth.users(id) on delete cascade,
    approver_id         uuid references auth.users(id) on delete set null,
    domain              text not null,
    type                text not null,
    data                jsonb not null default '{}'::jsonb,
    status              approval_status not null default 'pending',
    threshold_amount    numeric,
    approved_at         timestamptz,
    created_at          timestamptz not null default now()
);

-- Notifications
create table notifications (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    title       text not null,
    body        text,
    read        boolean not null default false,
    created_at  timestamptz not null default now()
);


-- ============================================================================
-- ACCOUNTING DOMAIN
-- ============================================================================

-- Chart of accounts
create table accounts (
    id      uuid primary key default gen_random_uuid(),
    org_id  uuid not null references orgs(id) on delete cascade,
    code    text not null,
    name    text not null,
    type    account_type not null,
    unique (org_id, code)
);

-- Journal entries
create table journals (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    date        date not null,
    description text,
    entries     jsonb not null default '[]'::jsonb,
    created_by  uuid not null references auth.users(id) on delete cascade,
    approved_by uuid references auth.users(id) on delete set null,
    created_at  timestamptz not null default now()
);

-- Invoices (receivable and payable)
create table invoices (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    contact_id  uuid,  -- FK added after contacts table is created
    type        invoice_type not null,
    amount      numeric not null default 0,
    tax_amount  numeric not null default 0,
    status      invoice_status not null default 'draft',
    due_date    date,
    pdf_url     text,
    created_at  timestamptz not null default now()
);

-- Expenses
create table expenses (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    category    text not null,
    amount      numeric not null default 0,
    tax_amount  numeric not null default 0,
    description text,
    receipt_url text,
    status      expense_status not null default 'pending',
    approved_by uuid references auth.users(id) on delete set null,
    created_at  timestamptz not null default now()
);


-- ============================================================================
-- HR DOMAIN
-- ============================================================================

-- Employees
create table employees (
    id              uuid primary key default gen_random_uuid(),
    org_id          uuid not null references orgs(id) on delete cascade,
    user_id         uuid not null references auth.users(id) on delete cascade,
    employee_number text not null,
    department      text,
    position        text,
    hire_date       date,
    salary_monthly  numeric not null default 0,
    paid_leave_total int not null default 20,
    paid_leave_used  int not null default 0,
    unique (org_id, employee_number)
);

-- Attendance records
create table attendance (
    id               uuid primary key default gen_random_uuid(),
    org_id           uuid not null references orgs(id) on delete cascade,
    employee_id      uuid not null references employees(id) on delete cascade,
    date             date not null,
    clock_in         timestamptz,
    clock_out        timestamptz,
    break_minutes    int not null default 0,
    overtime_minutes int not null default 0,
    type             attendance_type not null default 'normal',
    unique (employee_id, date)
);

-- Payroll
create table payroll (
    id           uuid primary key default gen_random_uuid(),
    org_id       uuid not null references orgs(id) on delete cascade,
    employee_id  uuid not null references employees(id) on delete cascade,
    period       text not null,
    base_salary  numeric not null default 0,
    overtime_pay numeric not null default 0,
    deductions   jsonb not null default '{}'::jsonb,
    net_pay      numeric not null default 0,
    paid_at      timestamptz,
    created_at   timestamptz not null default now(),
    unique (employee_id, period)
);


-- ============================================================================
-- CRM DOMAIN
-- ============================================================================

-- Contacts
create table contacts (
    id            uuid primary key default gen_random_uuid(),
    org_id        uuid not null references orgs(id) on delete cascade,
    company_name  text,
    contact_name  text not null,
    email         text,
    phone         text,
    address       text,
    tags          text[] not null default '{}',
    notes         text,
    created_at    timestamptz not null default now()
);

-- Add FK from invoices to contacts now that contacts table exists
alter table invoices
    add constraint invoices_contact_id_fkey
    foreign key (contact_id) references contacts(id) on delete set null;

-- Deals
create table deals (
    id                  uuid primary key default gen_random_uuid(),
    org_id              uuid not null references orgs(id) on delete cascade,
    contact_id          uuid references contacts(id) on delete set null,
    title               text not null,
    amount              numeric not null default 0,
    stage               deal_stage not null default 'lead',
    assigned_to         uuid references auth.users(id) on delete set null,
    expected_close_date date,
    created_at          timestamptz not null default now()
);

-- Interactions
create table interactions (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    contact_id  uuid not null references contacts(id) on delete cascade,
    deal_id     uuid references deals(id) on delete set null,
    type        interaction_type not null,
    summary     text,
    details     text,
    created_by  uuid not null references auth.users(id) on delete cascade,
    created_at  timestamptz not null default now()
);

-- Teleapo calls
create table teleapo_calls (
    id               uuid primary key default gen_random_uuid(),
    org_id           uuid not null references orgs(id) on delete cascade,
    contact_id       uuid not null references contacts(id) on delete cascade,
    caller           text,
    status           teleapo_call_status not null default 'scheduled',
    duration_seconds int not null default 0,
    transcript       text,
    result           text,
    next_action      text,
    scheduled_at     timestamptz,
    completed_at     timestamptz
);


-- ============================================================================
-- DOCUMENTS DOMAIN
-- ============================================================================

-- Documents
create table documents (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    title       text not null,
    category    document_category not null default 'other',
    content     text,
    file_url    text,
    version     int not null default 1,
    created_by  uuid not null references auth.users(id) on delete cascade,
    created_at  timestamptz not null default now()
);

-- Document embeddings for RAG / semantic search
create table doc_embeddings (
    id          uuid primary key default gen_random_uuid(),
    document_id uuid not null references documents(id) on delete cascade,
    chunk_index int not null,
    content     text not null,
    embedding   vector(1536) not null,
    unique (document_id, chunk_index)
);

-- Document templates
create table templates (
    id               uuid primary key default gen_random_uuid(),
    org_id           uuid not null references orgs(id) on delete cascade,
    name             text not null,
    category         document_category not null default 'other',
    content_template text not null,
    variables        jsonb not null default '[]'::jsonb,
    created_at       timestamptz not null default now()
);


-- ============================================================================
-- GENERAL AFFAIRS DOMAIN
-- ============================================================================

-- Equipment inventory
create table equipment (
    id            uuid primary key default gen_random_uuid(),
    org_id        uuid not null references orgs(id) on delete cascade,
    name          text not null,
    category      text,
    location      text,
    status        equipment_status not null default 'available',
    assigned_to   uuid references auth.users(id) on delete set null,
    photo_url     text,
    registered_by uuid not null references auth.users(id) on delete cascade,
    created_at    timestamptz not null default now()
);

-- Office requests (supplies, repairs, visitors, etc.)
create table office_requests (
    id          uuid primary key default gen_random_uuid(),
    org_id      uuid not null references orgs(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    type        office_request_type not null,
    description text not null,
    status      office_request_status not null default 'pending',
    created_at  timestamptz not null default now()
);


-- ============================================================================
-- HELPER FUNCTIONS (used in RLS policies)
-- ============================================================================

-- Check if user is a member of the given org
create or replace function is_org_member(_org_id uuid)
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from org_members
        where org_id = _org_id
          and user_id = auth.uid()
    );
$$;

-- Check if user has a specific domain permission (at least read)
-- permission values: "rw", "r", "none" (or absent = none)
create or replace function has_domain_permission(_org_id uuid, _domain text)
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from org_members
        where org_id = _org_id
          and user_id = auth.uid()
          and (
              role in ('owner', 'admin')
              or (permissions->>_domain) in ('r', 'rw')
          )
    );
$$;

-- Check if user has write permission for a domain
create or replace function has_domain_write_permission(_org_id uuid, _domain text)
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from org_members
        where org_id = _org_id
          and user_id = auth.uid()
          and (
              role in ('owner', 'admin')
              or (permissions->>_domain) = 'rw'
          )
    );
$$;

-- Get the employee_id for the current auth user within a given org
create or replace function my_employee_id(_org_id uuid)
returns uuid
language sql
stable
security definer
as $$
    select id from employees
    where org_id = _org_id
      and user_id = auth.uid()
    limit 1;
$$;


-- ============================================================================
-- ROW LEVEL SECURITY - ENABLE ON ALL TABLES
-- ============================================================================

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table user_profiles enable row level security;
alter table ai_logs enable row level security;
alter table approval_requests enable row level security;
alter table notifications enable row level security;

alter table accounts enable row level security;
alter table journals enable row level security;
alter table invoices enable row level security;
alter table expenses enable row level security;

alter table employees enable row level security;
alter table attendance enable row level security;
alter table payroll enable row level security;

alter table contacts enable row level security;
alter table deals enable row level security;
alter table interactions enable row level security;
alter table teleapo_calls enable row level security;

alter table documents enable row level security;
alter table doc_embeddings enable row level security;
alter table templates enable row level security;

alter table equipment enable row level security;
alter table office_requests enable row level security;


-- ============================================================================
-- RLS POLICIES - SHARED / COMMON
-- ============================================================================

-- orgs: members can view their own org
create policy "orgs_select_member"
    on orgs for select
    using (is_org_member(id));

-- orgs: only owner/admin can update
create policy "orgs_update_admin"
    on orgs for update
    using (
        exists (
            select 1 from org_members
            where org_members.org_id = orgs.id
              and org_members.user_id = auth.uid()
              and org_members.role in ('owner', 'admin')
        )
    );

-- org_members: members can view their org's members
create policy "org_members_select"
    on org_members for select
    using (is_org_member(org_id));

-- org_members: only owner/admin can insert
create policy "org_members_insert_admin"
    on org_members for insert
    with check (
        exists (
            select 1 from org_members as om
            where om.org_id = org_members.org_id
              and om.user_id = auth.uid()
              and om.role in ('owner', 'admin')
        )
    );

-- org_members: only owner/admin can update
create policy "org_members_update_admin"
    on org_members for update
    using (
        exists (
            select 1 from org_members as om
            where om.org_id = org_members.org_id
              and om.user_id = auth.uid()
              and om.role in ('owner', 'admin')
        )
    );

-- org_members: only owner can delete
create policy "org_members_delete_owner"
    on org_members for delete
    using (
        exists (
            select 1 from org_members as om
            where om.org_id = org_members.org_id
              and om.user_id = auth.uid()
              and om.role = 'owner'
        )
    );

-- user_profiles: users can view and edit their own profile
create policy "user_profiles_select_own"
    on user_profiles for select
    using (id = auth.uid());

create policy "user_profiles_select_org_colleagues"
    on user_profiles for select
    using (
        exists (
            select 1 from org_members om1
            join org_members om2 on om1.org_id = om2.org_id
            where om1.user_id = auth.uid()
              and om2.user_id = user_profiles.id
        )
    );

create policy "user_profiles_update_own"
    on user_profiles for update
    using (id = auth.uid());

create policy "user_profiles_insert_own"
    on user_profiles for insert
    with check (id = auth.uid());

-- ai_logs: members can view their org's logs
create policy "ai_logs_select"
    on ai_logs for select
    using (is_org_member(org_id));

create policy "ai_logs_insert"
    on ai_logs for insert
    with check (is_org_member(org_id) and user_id = auth.uid());

-- approval_requests: members can view their org's requests
create policy "approval_requests_select"
    on approval_requests for select
    using (is_org_member(org_id));

create policy "approval_requests_insert"
    on approval_requests for insert
    with check (is_org_member(org_id) and requester_id = auth.uid());

-- approval_requests: only the designated approver (or owner/admin) can update
create policy "approval_requests_update"
    on approval_requests for update
    using (
        is_org_member(org_id)
        and (
            approver_id = auth.uid()
            or exists (
                select 1 from org_members
                where org_members.org_id = approval_requests.org_id
                  and org_members.user_id = auth.uid()
                  and org_members.role in ('owner', 'admin')
            )
        )
    );

-- notifications: users can only see their own notifications
create policy "notifications_select_own"
    on notifications for select
    using (user_id = auth.uid() and is_org_member(org_id));

create policy "notifications_update_own"
    on notifications for update
    using (user_id = auth.uid() and is_org_member(org_id));

create policy "notifications_insert"
    on notifications for insert
    with check (is_org_member(org_id));


-- ============================================================================
-- RLS POLICIES - ACCOUNTING DOMAIN
-- Requires domain permission: 'accounting'
-- ============================================================================

-- accounts: read requires accounting permission
create policy "accounts_select"
    on accounts for select
    using (has_domain_permission(org_id, 'accounting'));

create policy "accounts_insert"
    on accounts for insert
    with check (has_domain_write_permission(org_id, 'accounting'));

create policy "accounts_update"
    on accounts for update
    using (has_domain_write_permission(org_id, 'accounting'));

create policy "accounts_delete"
    on accounts for delete
    using (has_domain_write_permission(org_id, 'accounting'));

-- journals
create policy "journals_select"
    on journals for select
    using (has_domain_permission(org_id, 'accounting'));

create policy "journals_insert"
    on journals for insert
    with check (has_domain_write_permission(org_id, 'accounting') and created_by = auth.uid());

create policy "journals_update"
    on journals for update
    using (has_domain_write_permission(org_id, 'accounting'));

-- invoices
create policy "invoices_select"
    on invoices for select
    using (has_domain_permission(org_id, 'accounting'));

create policy "invoices_insert"
    on invoices for insert
    with check (has_domain_write_permission(org_id, 'accounting'));

create policy "invoices_update"
    on invoices for update
    using (has_domain_write_permission(org_id, 'accounting'));

-- expenses: users can view their own expenses, or all if they have accounting permission
create policy "expenses_select_own"
    on expenses for select
    using (
        is_org_member(org_id)
        and (user_id = auth.uid() or has_domain_permission(org_id, 'accounting'))
    );

create policy "expenses_insert_own"
    on expenses for insert
    with check (is_org_member(org_id) and user_id = auth.uid());

create policy "expenses_update_accounting"
    on expenses for update
    using (
        is_org_member(org_id)
        and (
            (user_id = auth.uid() and status = 'pending')
            or has_domain_write_permission(org_id, 'accounting')
        )
    );


-- ============================================================================
-- RLS POLICIES - HR DOMAIN
-- Members see only their own attendance/payroll unless they have hr permission
-- ============================================================================

-- employees: hr permission to see all, otherwise own record only
create policy "employees_select"
    on employees for select
    using (
        is_org_member(org_id)
        and (user_id = auth.uid() or has_domain_permission(org_id, 'hr'))
    );

create policy "employees_insert"
    on employees for insert
    with check (has_domain_write_permission(org_id, 'hr'));

create policy "employees_update"
    on employees for update
    using (has_domain_write_permission(org_id, 'hr'));

-- attendance: own records or hr permission
create policy "attendance_select"
    on attendance for select
    using (
        is_org_member(org_id)
        and (
            employee_id = my_employee_id(org_id)
            or has_domain_permission(org_id, 'hr')
        )
    );

create policy "attendance_insert"
    on attendance for insert
    with check (
        is_org_member(org_id)
        and (
            employee_id = my_employee_id(org_id)
            or has_domain_write_permission(org_id, 'hr')
        )
    );

create policy "attendance_update"
    on attendance for update
    using (
        is_org_member(org_id)
        and (
            employee_id = my_employee_id(org_id)
            or has_domain_write_permission(org_id, 'hr')
        )
    );

-- payroll: own records or hr permission
create policy "payroll_select"
    on payroll for select
    using (
        is_org_member(org_id)
        and (
            employee_id = my_employee_id(org_id)
            or has_domain_permission(org_id, 'hr')
        )
    );

create policy "payroll_insert"
    on payroll for insert
    with check (has_domain_write_permission(org_id, 'hr'));

create policy "payroll_update"
    on payroll for update
    using (has_domain_write_permission(org_id, 'hr'));


-- ============================================================================
-- RLS POLICIES - CRM DOMAIN
-- Requires domain permission: 'crm'
-- ============================================================================

-- contacts
create policy "contacts_select"
    on contacts for select
    using (has_domain_permission(org_id, 'crm'));

create policy "contacts_insert"
    on contacts for insert
    with check (has_domain_write_permission(org_id, 'crm'));

create policy "contacts_update"
    on contacts for update
    using (has_domain_write_permission(org_id, 'crm'));

create policy "contacts_delete"
    on contacts for delete
    using (has_domain_write_permission(org_id, 'crm'));

-- deals
create policy "deals_select"
    on deals for select
    using (has_domain_permission(org_id, 'crm'));

create policy "deals_insert"
    on deals for insert
    with check (has_domain_write_permission(org_id, 'crm'));

create policy "deals_update"
    on deals for update
    using (has_domain_write_permission(org_id, 'crm'));

-- interactions
create policy "interactions_select"
    on interactions for select
    using (has_domain_permission(org_id, 'crm'));

create policy "interactions_insert"
    on interactions for insert
    with check (has_domain_write_permission(org_id, 'crm') and created_by = auth.uid());

-- teleapo_calls
create policy "teleapo_calls_select"
    on teleapo_calls for select
    using (has_domain_permission(org_id, 'crm'));

create policy "teleapo_calls_insert"
    on teleapo_calls for insert
    with check (has_domain_write_permission(org_id, 'crm'));

create policy "teleapo_calls_update"
    on teleapo_calls for update
    using (has_domain_write_permission(org_id, 'crm'));


-- ============================================================================
-- RLS POLICIES - DOCUMENTS DOMAIN
-- Requires domain permission: 'documents'
-- ============================================================================

-- documents
create policy "documents_select"
    on documents for select
    using (has_domain_permission(org_id, 'documents'));

create policy "documents_insert"
    on documents for insert
    with check (has_domain_write_permission(org_id, 'documents') and created_by = auth.uid());

create policy "documents_update"
    on documents for update
    using (has_domain_write_permission(org_id, 'documents'));

create policy "documents_delete"
    on documents for delete
    using (has_domain_write_permission(org_id, 'documents'));

-- doc_embeddings: follows document access (join through document_id)
create policy "doc_embeddings_select"
    on doc_embeddings for select
    using (
        exists (
            select 1 from documents d
            where d.id = doc_embeddings.document_id
              and has_domain_permission(d.org_id, 'documents')
        )
    );

create policy "doc_embeddings_insert"
    on doc_embeddings for insert
    with check (
        exists (
            select 1 from documents d
            where d.id = doc_embeddings.document_id
              and has_domain_write_permission(d.org_id, 'documents')
        )
    );

create policy "doc_embeddings_delete"
    on doc_embeddings for delete
    using (
        exists (
            select 1 from documents d
            where d.id = doc_embeddings.document_id
              and has_domain_write_permission(d.org_id, 'documents')
        )
    );

-- templates
create policy "templates_select"
    on templates for select
    using (has_domain_permission(org_id, 'documents'));

create policy "templates_insert"
    on templates for insert
    with check (has_domain_write_permission(org_id, 'documents'));

create policy "templates_update"
    on templates for update
    using (has_domain_write_permission(org_id, 'documents'));

create policy "templates_delete"
    on templates for delete
    using (has_domain_write_permission(org_id, 'documents'));


-- ============================================================================
-- RLS POLICIES - GENERAL AFFAIRS DOMAIN
-- Requires domain permission: 'general_affairs'
-- ============================================================================

-- equipment
create policy "equipment_select"
    on equipment for select
    using (has_domain_permission(org_id, 'general_affairs'));

create policy "equipment_insert"
    on equipment for insert
    with check (has_domain_write_permission(org_id, 'general_affairs') and registered_by = auth.uid());

create policy "equipment_update"
    on equipment for update
    using (has_domain_write_permission(org_id, 'general_affairs'));

-- office_requests: users can view their own or all if they have general_affairs permission
create policy "office_requests_select"
    on office_requests for select
    using (
        is_org_member(org_id)
        and (user_id = auth.uid() or has_domain_permission(org_id, 'general_affairs'))
    );

create policy "office_requests_insert"
    on office_requests for insert
    with check (is_org_member(org_id) and user_id = auth.uid());

create policy "office_requests_update"
    on office_requests for update
    using (
        is_org_member(org_id)
        and (
            (user_id = auth.uid() and status = 'pending')
            or has_domain_write_permission(org_id, 'general_affairs')
        )
    );


-- ============================================================================
-- INDEXES
-- ============================================================================

-- Shared tables
create index idx_org_members_user_id on org_members(user_id);
create index idx_org_members_org_id on org_members(org_id);
create index idx_ai_logs_org_id on ai_logs(org_id);
create index idx_ai_logs_created_at on ai_logs(created_at);
create index idx_ai_logs_domain on ai_logs(domain);
create index idx_approval_requests_org_id on approval_requests(org_id);
create index idx_approval_requests_status on approval_requests(status);
create index idx_approval_requests_approver_id on approval_requests(approver_id);
create index idx_approval_requests_created_at on approval_requests(created_at);
create index idx_notifications_org_id on notifications(org_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_read on notifications(user_id, read);
create index idx_notifications_created_at on notifications(created_at);

-- Accounting
create index idx_accounts_org_id on accounts(org_id);
create index idx_accounts_type on accounts(org_id, type);
create index idx_journals_org_id on journals(org_id);
create index idx_journals_date on journals(org_id, date);
create index idx_journals_created_at on journals(created_at);
create index idx_invoices_org_id on invoices(org_id);
create index idx_invoices_status on invoices(org_id, status);
create index idx_invoices_due_date on invoices(org_id, due_date);
create index idx_invoices_contact_id on invoices(contact_id);
create index idx_invoices_created_at on invoices(created_at);
create index idx_expenses_org_id on expenses(org_id);
create index idx_expenses_status on expenses(org_id, status);
create index idx_expenses_user_id on expenses(user_id);
create index idx_expenses_created_at on expenses(created_at);

-- HR
create index idx_employees_org_id on employees(org_id);
create index idx_employees_user_id on employees(user_id);
create index idx_employees_department on employees(org_id, department);
create index idx_attendance_org_id on attendance(org_id);
create index idx_attendance_employee_id on attendance(employee_id);
create index idx_attendance_date on attendance(org_id, date);
create index idx_payroll_org_id on payroll(org_id);
create index idx_payroll_employee_id on payroll(employee_id);
create index idx_payroll_period on payroll(org_id, period);

-- CRM
create index idx_contacts_org_id on contacts(org_id);
create index idx_contacts_tags on contacts using gin(tags);
create index idx_contacts_created_at on contacts(created_at);
create index idx_deals_org_id on deals(org_id);
create index idx_deals_stage on deals(org_id, stage);
create index idx_deals_contact_id on deals(contact_id);
create index idx_deals_assigned_to on deals(assigned_to);
create index idx_deals_expected_close on deals(org_id, expected_close_date);
create index idx_deals_created_at on deals(created_at);
create index idx_interactions_org_id on interactions(org_id);
create index idx_interactions_contact_id on interactions(contact_id);
create index idx_interactions_deal_id on interactions(deal_id);
create index idx_interactions_created_at on interactions(created_at);
create index idx_teleapo_calls_org_id on teleapo_calls(org_id);
create index idx_teleapo_calls_contact_id on teleapo_calls(contact_id);
create index idx_teleapo_calls_status on teleapo_calls(org_id, status);
create index idx_teleapo_calls_scheduled_at on teleapo_calls(scheduled_at);

-- Documents
create index idx_documents_org_id on documents(org_id);
create index idx_documents_category on documents(org_id, category);
create index idx_documents_created_at on documents(created_at);
create index idx_doc_embeddings_document_id on doc_embeddings(document_id);
create index idx_templates_org_id on templates(org_id);
create index idx_templates_category on templates(org_id, category);

-- General Affairs
create index idx_equipment_org_id on equipment(org_id);
create index idx_equipment_status on equipment(org_id, status);
create index idx_equipment_assigned_to on equipment(assigned_to);
create index idx_office_requests_org_id on office_requests(org_id);
create index idx_office_requests_status on office_requests(org_id, status);
create index idx_office_requests_user_id on office_requests(user_id);
create index idx_office_requests_created_at on office_requests(created_at);

-- HNSW index for vector similarity search on doc_embeddings
create index idx_doc_embeddings_vector on doc_embeddings
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);
