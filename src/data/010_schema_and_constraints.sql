-- === EXTENSIONS ===
create extension if not exists btree_gist;

-- === PROFILES ===
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'guest' check (role in ('guest','host')),
  created_at timestamptz not null default now()
);

-- === PROPERTIES ===
alter table public.properties
  add column if not exists owner_id uuid references auth.users(id) on delete cascade,
  add column if not exists main_image_url text,
  add column if not exists image_urls text[] default '{}',
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz not null default now();

-- === BOOKINGS ===
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  total_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists bookings_property_id_idx on public.bookings(property_id);
create index if not exists bookings_user_id_idx on public.bookings(user_id);

-- === CONSTRAINTS ===
alter table public.bookings
  drop constraint if exists bookings_ci_lt_co;
alter table public.bookings
  add  constraint bookings_ci_lt_co check (check_in < check_out);

alter table public.bookings
  drop constraint if exists no_overlap_per_property;
alter table public.bookings
  add  constraint no_overlap_per_property
  exclude using gist (
    property_id with =,
    daterange(check_in, check_out, '[)') with &&
  );