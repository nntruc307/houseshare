-- houseshare: initial schema
-- Money is stored in VND (integer). kWh readings are numeric.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Rooms, meters, people
-- ---------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- '101', '102', ...
  name text not null,                        -- display name, e.g. 'Ngọc Trâm'
  color text not null default 'indigo',      -- key into the app palette
  default_rent integer not null default 0 check (default_rent >= 0),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.meters (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  label text not null default 'Công tơ',
  sort integer not null default 0,
  active boolean not null default true
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.room_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_date date not null default current_date,
  end_date date,
  check (end_date is null or end_date >= start_date)
);
create index on public.room_memberships (profile_id);
create index on public.room_memberships (room_id);

-- ---------------------------------------------------------------------------
-- Monthly billing
-- ---------------------------------------------------------------------------

create table public.periods (
  id uuid primary key default gen_random_uuid(),
  month date not null unique check (extract(day from month) = 1),
  main_kwh numeric not null default 0 check (main_kwh >= 0),
  electricity_amount integer not null default 0 check (electricity_amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'closed')),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.period_rooms (
  period_id uuid not null references public.periods(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  rent integer not null default 0 check (rent >= 0),
  people integer not null default 0 check (people >= 0),
  -- Only used for months imported from the old Excel file, where a room that
  -- had advanced money for a bill got it deducted. Always 0 for new months.
  adjustment integer not null default 0,
  adjustment_note text,
  paid boolean not null default false,
  paid_at timestamptz,
  primary key (period_id, room_id)
);

create table public.meter_readings (
  period_id uuid not null references public.periods(id) on delete cascade,
  meter_id uuid not null references public.meters(id) on delete cascade,
  old_value numeric,
  new_value numeric,
  primary key (period_id, meter_id)
);

create table public.period_expenses (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete cascade,
  kind text not null check (kind in ('wifi', 'water', 'trash', 'other')),
  name text not null,
  amount integer not null default 0 check (amount >= 0),
  sort integer not null default 0
);
create index on public.period_expenses (period_id);

-- ---------------------------------------------------------------------------
-- Cleaning rota
-- ---------------------------------------------------------------------------

create table public.cleaning_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  room_id uuid not null references public.rooms(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'done')),
  rescheduled boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.cleaning_slots (slot_date);

create table public.cleaning_logs (
  id uuid primary key default gen_random_uuid(),
  cleaned_on date not null,
  room_id uuid not null references public.rooms(id) on delete cascade,
  slot_id uuid references public.cleaning_slots(id) on delete set null,
  substitute_for uuid references public.rooms(id) on delete set null,
  recorded_by uuid references public.profiles(id) on delete set null,
  source text not null default 'app' check (source in ('app', 'admin', 'excel')),
  created_at timestamptz not null default now()
);
create index on public.cleaning_logs (cleaned_on desc);

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------

create table public.settings (
  id integer primary key default 1 check (id = 1),
  house_name text not null default 'Nhà chung',
  address text not null default '',
  bank_code text not null default '',       -- VietQR bank code, e.g. 'VCB'
  bank_account text not null default '',
  bank_account_name text not null default ''
);
insert into public.settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   Everyone who is an active member can read everything (the house is fully
--   transparent), except draft months, which only admins see.
--   Only admins write. Cleaning records from members go through a server
--   action that checks the member's room before writing.
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.meters enable row level security;
alter table public.profiles enable row level security;
alter table public.room_memberships enable row level security;
alter table public.periods enable row level security;
alter table public.period_rooms enable row level security;
alter table public.meter_readings enable row level security;
alter table public.period_expenses enable row level security;
alter table public.cleaning_slots enable row level security;
alter table public.cleaning_logs enable row level security;
alter table public.settings enable row level security;

-- read
create policy "members read rooms" on public.rooms for select to authenticated using (public.is_active_user());
create policy "members read meters" on public.meters for select to authenticated using (public.is_active_user());
create policy "members read profiles" on public.profiles for select to authenticated using (public.is_active_user() or id = auth.uid());
create policy "members read memberships" on public.room_memberships for select to authenticated using (public.is_active_user());
create policy "members read closed periods" on public.periods for select to authenticated
  using (public.is_admin() or (public.is_active_user() and status = 'closed'));
create policy "members read period rooms" on public.period_rooms for select to authenticated
  using (public.is_admin() or exists (select 1 from public.periods p where p.id = period_id and p.status = 'closed' and public.is_active_user()));
create policy "members read readings" on public.meter_readings for select to authenticated
  using (public.is_admin() or exists (select 1 from public.periods p where p.id = period_id and p.status = 'closed' and public.is_active_user()));
create policy "members read expenses" on public.period_expenses for select to authenticated
  using (public.is_admin() or exists (select 1 from public.periods p where p.id = period_id and p.status = 'closed' and public.is_active_user()));
create policy "members read slots" on public.cleaning_slots for select to authenticated using (public.is_active_user());
create policy "members read logs" on public.cleaning_logs for select to authenticated using (public.is_active_user());
create policy "members read settings" on public.settings for select to authenticated using (public.is_active_user());

-- write (admins)
create policy "admins write rooms" on public.rooms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write meters" on public.meters for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write memberships" on public.room_memberships for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write periods" on public.periods for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write period rooms" on public.period_rooms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write readings" on public.meter_readings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write expenses" on public.period_expenses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write slots" on public.cleaning_slots for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write logs" on public.cleaning_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins write settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Members may not change their own role/active flag; profile edits are admin-only above.
