-- Payment status is private to admins and the room itself, while a bill stays
-- visible to the whole house. RLS works per row, so it moves to its own table.

create or replace function private.is_my_room(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_memberships m
    where m.profile_id = auth.uid()
      and m.room_id = target
      and m.start_date <= (now() at time zone 'Asia/Ho_Chi_Minh')::date
      and (m.end_date is null or m.end_date >= (now() at time zone 'Asia/Ho_Chi_Minh')::date)
  );
$$;

revoke all on function private.is_my_room(uuid) from public, anon;
grant execute on function private.is_my_room(uuid) to authenticated;

create table public.period_room_payments (
  period_id uuid not null,
  room_id uuid not null,
  paid boolean not null default false,
  paid_at timestamptz,
  payment_reported_at timestamptz,
  primary key (period_id, room_id),
  foreign key (period_id, room_id) references public.period_rooms(period_id, room_id) on delete cascade
);

alter table public.period_room_payments enable row level security;

create policy "own room or admin reads payments" on public.period_room_payments
  for select to authenticated
  using (private.is_admin() or (private.is_active_user() and private.is_my_room(room_id)));

create policy "admins write payments" on public.period_room_payments
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

revoke all on public.period_room_payments from anon;
grant select, insert, update, delete on public.period_room_payments to authenticated;
grant all on public.period_room_payments to service_role;

insert into public.period_room_payments (period_id, room_id, paid, paid_at, payment_reported_at)
select period_id, room_id, paid, paid_at, payment_reported_at
from public.period_rooms
where paid or payment_reported_at is not null;

-- Keeps the new table current while the previous app version still writes the
-- old columns. Removed together with those columns in the next migration.
create function private.sync_period_room_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.period_room_payments (period_id, room_id, paid, paid_at, payment_reported_at)
  values (new.period_id, new.room_id, new.paid, new.paid_at, new.payment_reported_at)
  on conflict (period_id, room_id) do update
    set paid = excluded.paid, paid_at = excluded.paid_at, payment_reported_at = excluded.payment_reported_at;
  return new;
end;
$$;

create trigger sync_period_room_payment
  after update of paid, paid_at, payment_reported_at on public.period_rooms
  for each row execute function private.sync_period_room_payment();
