-- Room names change as tenants change; room numbers stay. Each month keeps the
-- name the room had then, so renaming a room never rewrites past bills.
alter table public.period_rooms add column if not exists room_name text;

-- Existing months start with the room's current name; fix individual months afterwards.
update public.period_rooms pr
set room_name = r.name
from public.rooms r
where r.id = pr.room_id and pr.room_name is null;

comment on column public.period_rooms.room_name is
  'Room display name for this month. Null falls back to rooms.name.';
