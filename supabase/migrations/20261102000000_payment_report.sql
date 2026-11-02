-- A room reports it has transferred the money; an admin then confirms it as paid.
alter table public.period_rooms add column if not exists payment_reported_at timestamptz;

comment on column public.period_rooms.payment_reported_at is
  'When the room reported its transfer. Set while waiting for an admin to confirm; cleared on confirm or reject.';
