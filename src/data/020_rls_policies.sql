-- Aktivera Row Level Security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.bookings enable row level security;

-- === PROFILES ===
drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles upsert own" on public.profiles;

create policy "profiles select own"
  on public.profiles for select using (auth.uid() = user_id);

create policy "profiles update own"
  on public.profiles for update using (auth.uid() = user_id);

create policy "profiles upsert own"
  on public.profiles for insert with check (auth.uid() = user_id);

-- === PROPERTIES ===
drop policy if exists "public read active" on public.properties;
drop policy if exists "owner write" on public.properties;

create policy "public read active"
  on public.properties for select to public
  using (is_active = true);

create policy "owner write"
  on public.properties for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- === BOOKINGS ===
drop policy if exists "user reads own" on public.bookings;
drop policy if exists "owner reads property bookings" on public.bookings;
drop policy if exists "user inserts own" on public.bookings;
drop policy if exists "user updates own" on public.bookings;
drop policy if exists "user deletes own" on public.bookings;

create policy "user reads own"
  on public.bookings for select to authenticated
  using (auth.uid() = user_id);

create policy "owner reads property bookings"
  on public.bookings for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = bookings.property_id
        and p.owner_id = auth.uid()
    )
  );

create policy "user inserts own"
  on public.bookings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user updates own"
  on public.bookings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user deletes own"
  on public.bookings for delete to authenticated
  using (auth.uid() = user_id);