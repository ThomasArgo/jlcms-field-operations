create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  legacy_team_id text unique,
  team_name text not null,
  invite_code text,
  today_focus_custom text,
  company_address text,
  billing_contact_name text,
  billing_contact_email text,
  billing_contact_phone text,
  payment_terms text,
  accepted_payment_methods text,
  payment_instructions text,
  roles jsonb not null default '[]'::jsonb,
  role_permissions jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  auth_user_id uuid unique,
  legacy_user_id text unique,
  name text not null,
  email text not null unique,
  role text not null default 'member',
  approved boolean not null default false,
  profile_pic text,
  active_session_id text,
  last_login_at timestamptz,
  must_reset_password boolean not null default false,
  password_reset_source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_client_id text unique,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_vendor_id text unique,
  code text,
  company text not null,
  trade text,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inspectors (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_inspector_id text unique,
  name text not null,
  inspector_type text,
  department text,
  email text,
  phone text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_property_id text unique,
  client_id uuid references public.clients(id) on delete set null,
  legacy_invoice_id text,
  address text not null,
  work_type text default '-- Select --',
  permit_status text default '--',
  permit_number text,
  hcad_number text,
  submitted_to text,
  submitted_date date,
  started_at timestamptz,
  electric boolean not null default false,
  gas boolean not null default false,
  water boolean not null default false,
  notes text,
  is_completed boolean not null default false,
  completed_at timestamptz,
  invoice_status text,
  work_order_number text,
  county_pm_name text,
  mobilization_date date,
  ticket811 text,
  permit_portal_url text,
  prepared_by text,
  compliance_notes text,
  assigned_vendor_ids uuid[] not null default '{}',
  assigned_inspector_ids uuid[] not null default '{}',
  photos jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_task_id text unique,
  assigned_user_id uuid references public.users(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  detail text,
  due_date date,
  due_time text,
  priority text default 'Normal',
  status text default 'To Do',
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recurring_weekly_schedule (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_schedule_id text unique,
  user_id uuid references public.users(id) on delete set null,
  day text not null,
  start_time text,
  end_time text,
  note text,
  record jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.oneoff_schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  legacy_block_id text unique,
  user_id uuid references public.users(id) on delete set null,
  block_date date,
  start_time text,
  end_time text,
  title text,
  detail text,
  type text default 'supplement',
  record jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_state (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_team_id on public.users(team_id);
create index if not exists idx_clients_team_id on public.clients(team_id);
create index if not exists idx_vendors_team_id on public.vendors(team_id);
create index if not exists idx_inspectors_team_id on public.inspectors(team_id);
create index if not exists idx_properties_team_id on public.properties(team_id);
create index if not exists idx_properties_client_id on public.properties(client_id);
create index if not exists idx_tasks_team_id on public.tasks(team_id);
create index if not exists idx_tasks_assigned_user_id on public.tasks(assigned_user_id);
create index if not exists idx_tasks_property_id on public.tasks(property_id);
create index if not exists idx_recurring_schedule_team_id on public.recurring_weekly_schedule(team_id);
create index if not exists idx_oneoff_schedule_team_id on public.oneoff_schedule_blocks(team_id);
create index if not exists idx_workspace_state_team_id on public.workspace_state(team_id);
