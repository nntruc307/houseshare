-- The old payment columns stay until they are dropped, but signed-in users can
-- no longer read them. Other columns keep their access.
revoke select on public.period_rooms from authenticated, anon;
grant select (period_id, room_id, rent, people, room_name, adjustment, adjustment_note)
  on public.period_rooms to authenticated;
