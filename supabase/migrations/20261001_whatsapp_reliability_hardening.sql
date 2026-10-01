create table if not exists public.whatsapp_inbound_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id text not null,
  status text not null default 'PROCESSING'
    check (status in ('PROCESSING','DONE','FAILED')),
  reply text,
  delivered_at timestamptz,
  last_error text,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

alter table public.whatsapp_inbound_receipts enable row level security;
revoke all on table public.whatsapp_inbound_receipts from anon, authenticated;
grant select, insert, update, delete on table public.whatsapp_inbound_receipts to service_role;

create index if not exists whatsapp_inbound_receipts_status_idx
  on public.whatsapp_inbound_receipts (user_id, status, updated_at desc);
