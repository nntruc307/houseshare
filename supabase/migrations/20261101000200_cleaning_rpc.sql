-- Applies a cleaning record and any rota changes atomically.
-- The decision of WHAT to change is made (and unit-tested) in src/lib/cleaning.ts;
-- this function only applies it in one transaction. Callable by the server
-- (service role) only: members never write to these tables directly.
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
begin
  if not exists (select 1 from public.cleaning_slots where id = p_slot and status = 'pending') then
    raise exception 'Lượt dọn này đã được ghi nhận hoặc không còn tồn tại';
  end if;

  for c in select * from jsonb_array_elements(coalesce(p_changes, '[]'::jsonb)) loop
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
  end loop;

  update public.cleaning_slots set status = 'done' where id = p_slot;

  insert into public.cleaning_logs (cleaned_on, room_id, slot_id, substitute_for, recorded_by, source)
  values (p_cleaned_on, p_room, p_slot, p_substitute_for, p_recorded_by, p_source)
  returning id into log_id;

  return log_id;
end;
$$;

-- Undo: delete a record and re-open its slot (admin only, via the server).
create or replace function public.undo_cleaning_log(p_log uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s uuid;
begin
  select slot_id into s from public.cleaning_logs where id = p_log;
  delete from public.cleaning_logs where id = p_log;
  if s is not null then
    update public.cleaning_slots set status = 'pending' where id = s;
  end if;
end;
$$;

-- Swap the rooms of two pending slots (admin only, via the server).
create or replace function public.swap_cleaning_slots(p_a uuid, p_b uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ra uuid;
  rb uuid;
begin
  select room_id into ra from public.cleaning_slots where id = p_a and status = 'pending';
  select room_id into rb from public.cleaning_slots where id = p_b and status = 'pending';
  if ra is null or rb is null then
    raise exception 'Chỉ đổi được các lượt chưa dọn';
  end if;
  update public.cleaning_slots set room_id = rb, rescheduled = true where id = p_a;
  update public.cleaning_slots set room_id = ra, rescheduled = true where id = p_b;
end;
$$;

revoke all on function public.apply_cleaning_plan(uuid, date, uuid, uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.undo_cleaning_log(uuid) from public, anon, authenticated;
revoke all on function public.swap_cleaning_slots(uuid, uuid) from public, anon, authenticated;
grant execute on function public.apply_cleaning_plan(uuid, date, uuid, uuid, uuid, text, jsonb) to service_role;
grant execute on function public.undo_cleaning_log(uuid) to service_role;
grant execute on function public.swap_cleaning_slots(uuid, uuid) to service_role;
