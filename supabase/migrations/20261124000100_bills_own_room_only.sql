-- Members see only their own room's bill. Admins see every room.
-- House-wide totals (periods, period_expenses) stay readable by every active member.
-- The app reads other rooms' rows with the server key to work out the shared
-- electricity split, then hands the page the viewer's own room only.

drop policy if exists "members read period rooms" on public.period_rooms;
create policy "own room or admin reads period rooms" on public.period_rooms
  for select to authenticated
  using (private.is_admin() or (private.is_active_user() and private.is_my_room(room_id)));

-- Raw meter readings of every room: admins only.
drop policy if exists "members read readings" on public.meter_readings;
create policy "admins read readings" on public.meter_readings
  for select to authenticated
  using (private.is_admin());
