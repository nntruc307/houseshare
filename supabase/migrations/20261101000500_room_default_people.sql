-- Head count per room is set by hand in the Rooms tab: not everyone living in a
-- room has an account. Draft months follow it; closed months keep their own.
alter table public.rooms
  add column if not exists default_people integer not null default 1 check (default_people >= 0);

-- Start from the newest month's head count.
update public.rooms r
set default_people = pr.people
from public.period_rooms pr
join public.periods p on p.id = pr.period_id
where pr.room_id = r.id
  and p.month = (select max(month) from public.periods);
