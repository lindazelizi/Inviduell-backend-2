-- BOOKINGS
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  property_id uuid not null references properties(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  total_price numeric not null,
  created_at timestamptz not null default now(),
  constraint check_dates check (check_out > check_in)
);
alter table bookings enable row level security;

-- alla får läsa sina egna, ägare får läsa bokningar på sin egendom om du vill bygga ut senare
create policy "user can read own bookings"
on bookings for select
to authenticated
using (auth.uid() = user_id);

create policy "user can create own bookings"
on bookings for insert
to authenticated
with check (auth.uid() = user_id);