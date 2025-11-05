-- PROPERTIES
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  description text,
  location text,
  price_per_night numeric not null check (price_per_night >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table properties enable row level security;

create policy "public read active"
on properties for select
to public
using (is_active = true);

create policy "owner write"
on properties for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);