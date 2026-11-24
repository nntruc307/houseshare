-- Undoing a cleaning record used to only re-open its slot, leaving the rooms
-- that had been moved by a covering clean in their new places. Keep what each
-- record changed so undo can put the rota back.
alter table public.cleaning_logs add column if not exists slot_changes jsonb;

create or replace function public.apply_cleaning_plan(
  p_slot uuid,
  p_cleaned_on date,
  p_room uuid,
  p_substitute_for uuid,
  p_recorded_by uuid,
  p_source text,
  p_changes jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c jsonb;
  n int;
  log_id uuid;
  before jsonb := '[]'::jsonb;
  prev record;
begin
  if not exists (select 1 from public.cleaning_slots where id = p_slot and status = 'pending') then
    raise exception 'Lượt dọn này đã được ghi nhận hoặc không còn tồn tại';
  end if;

  for c in select * from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb)) loop
    select room_id, rescheduled into prev from public.cleaning_slots where id = (c->>'slotId')::uuid;
    update public.cleaning_slots
       set room_id = (c->>'toRoomId')::uuid,
           rescheduled = ((c->>'slotId')::uuid <> p_slot)
     where id = (c->>'slotId')::uuid
       and room_id = (c->>'fromRoomId')::uuid
       and status = 'pending';
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'Lịch dọn vừa được thay đổi, vui lòng tải lại trang và thử lại';
    end if;
    before := before || jsonb_build_object(
      'slotId', c->>'slotId',
      'roomId', prev.room_id,
      'toRoomId', c->>'toRoomId',
      'rescheduled', prev.rescheduled
    );
  end loop;

  update public.cleaning_slots set status = 'done' where id = p_slot;

  insert into public.cleaning_logs (cleaned_on, room_id, slot_id, substitute_for, recorded_by, source, slot_changes)
  values (p_cleaned_on, p_room, p_slot, p_substitute_for, p_recorded_by, p_source, before)
  returning id into log_id;

  return log_id;
end;
$$;

create or replace function public.undo_cleaning_log(p_log uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s uuid;
  ch jsonb;
  c jsonb;
begin
  select slot_id, slot_changes into s, ch from public.cleaning_logs where id = p_log;
  delete from public.cleaning_logs where id = p_log;
  if s is not null then
    update public.cleaning_slots set status = 'pending' where id = s;
  end if;
  -- put moved rooms back, but only slots that still hold what this record gave them
  for c in select * from jsonb_array_elements(coalesce(ch, '[]'::jsonb)) loop
    update public.cleaning_slots
       set room_id = (c->>'roomId')::uuid,
           rescheduled = (c->>'rescheduled')::boolean
     where id = (c->>'slotId')::uuid
       and room_id = (c->>'toRoomId')::uuid
       and status = 'pending';
  end loop;
end;
$$;

revoke all on function public.apply_cleaning_plan(uuid, date, uuid, uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.undo_cleaning_log(uuid) from public, anon, authenticated;
grant execute on function public.apply_cleaning_plan(uuid, date, uuid, uuid, uuid, text, jsonb) to service_role;
grant execute on function public.undo_cleaning_log(uuid) to service_role;
