set lock_timeout = '5s';

create unique index if not exists xp_transactions_idempotency_idx
  on public.xp_transactions (user_id, source_type, source_id)
  where source_id is not null;

grant select, insert, update on table public.whatsapp_inbound_receipts to anon;

drop policy if exists whatsapp_inbound_receipts_worker_select on public.whatsapp_inbound_receipts;
create policy whatsapp_inbound_receipts_worker_select
  on public.whatsapp_inbound_receipts
  for select
  to anon
  using (public.mentra_worker_authorized());

drop policy if exists whatsapp_inbound_receipts_worker_insert on public.whatsapp_inbound_receipts;
create policy whatsapp_inbound_receipts_worker_insert
  on public.whatsapp_inbound_receipts
  for insert
  to anon
  with check (public.mentra_worker_authorized());

drop policy if exists whatsapp_inbound_receipts_worker_update on public.whatsapp_inbound_receipts;
create policy whatsapp_inbound_receipts_worker_update
  on public.whatsapp_inbound_receipts
  for update
  to anon
  using (public.mentra_worker_authorized())
  with check (public.mentra_worker_authorized());
