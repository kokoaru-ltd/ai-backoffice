-- ============================================================================
-- LINE User Mapping Table
-- Migration: 002_line_users.sql
--
-- Maps LINE user IDs to Supabase auth users and organizations.
-- Used by the line-webhook Edge Function to identify incoming LINE messages.
-- ============================================================================

-- LINE user mapping table
create table line_users (
    line_user_id    text primary key,
    user_id         uuid not null references auth.users(id) on delete cascade,
    org_id          uuid not null references orgs(id) on delete cascade,
    display_name    text,
    registered_at   timestamptz not null default now()
);

-- Indexes for common lookup patterns
create index idx_line_users_user_id on line_users(user_id);
create index idx_line_users_org_id on line_users(org_id);

-- Enable Row Level Security
alter table line_users enable row level security;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can view their own LINE mapping
create policy "line_users_select_own"
    on line_users for select
    using (user_id = auth.uid());

-- Org admins/owners can view all LINE mappings in their org
create policy "line_users_select_org_admin"
    on line_users for select
    using (
        exists (
            select 1 from org_members
            where org_members.org_id = line_users.org_id
              and org_members.user_id = auth.uid()
              and org_members.role in ('owner', 'admin')
        )
    );

-- Users can insert their own LINE mapping (self-registration via dashboard)
create policy "line_users_insert_own"
    on line_users for insert
    with check (
        user_id = auth.uid()
        and is_org_member(org_id)
    );

-- Users can update their own LINE mapping
create policy "line_users_update_own"
    on line_users for update
    using (user_id = auth.uid());

-- Users can delete their own LINE mapping (unlinking)
create policy "line_users_delete_own"
    on line_users for delete
    using (user_id = auth.uid());

-- Org admins/owners can delete any LINE mapping in their org
create policy "line_users_delete_org_admin"
    on line_users for delete
    using (
        exists (
            select 1 from org_members
            where org_members.org_id = line_users.org_id
              and org_members.user_id = auth.uid()
              and org_members.role in ('owner', 'admin')
        )
    );

-- ============================================================================
-- Unique constraint: one Supabase user can only link one LINE account per org
-- ============================================================================
create unique index idx_line_users_user_org on line_users(user_id, org_id);
