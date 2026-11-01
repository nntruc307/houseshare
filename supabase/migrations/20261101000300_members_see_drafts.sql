-- Members can see draft months too (shown as "Bản nháp, chưa chốt", no payment QR).
drop policy "members read closed periods" on public.periods;
drop policy "members read period rooms" on public.period_rooms;
drop policy "members read readings" on public.meter_readings;
drop policy "members read expenses" on public.period_expenses;

create policy "members read periods" on public.periods for select to authenticated
  using (private.is_active_user());
create policy "members read period rooms" on public.period_rooms for select to authenticated
  using (private.is_active_user());
create policy "members read readings" on public.meter_readings for select to authenticated
  using (private.is_active_user());
create policy "members read expenses" on public.period_expenses for select to authenticated
  using (private.is_active_user());
