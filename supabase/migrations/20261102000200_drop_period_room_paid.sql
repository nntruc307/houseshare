-- The app now reads period_room_payments, so the old columns, which every
-- member could read, can go.
drop trigger sync_period_room_payment on public.period_rooms;
drop function private.sync_period_room_payment();

alter table public.period_rooms
  drop column paid,
  drop column paid_at,
  drop column payment_reported_at;
