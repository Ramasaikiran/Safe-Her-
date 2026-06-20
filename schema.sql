-- ════════════════════════════════════════════════════════════
-- SafeShe Supabase Schema — Email OTP auth, phone optional
-- Run this in your Supabase SQL editor (or via apply_migration)
-- ════════════════════════════════════════════════════════════

-- 1. Profiles (extends auth.users). Auth identity = email. Phone is a
--    free-text contact field only (so guides can reach travellers),
--    never used for login.
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text not null,
  phone text,
  role text not null default 'traveller' check (role in ('traveller','guide','admin')),
  city text,
  avatar_url text,
  bio text,
  travel_interests text[] default '{}',
  favorite_destinations text[] default '{}',
  languages text[] default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 2. Guide profiles (verification + rates), linked 1:1 to profiles where role = 'guide'
create table if not exists public.guide_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  status text not null default 'pending' check (status in ('pending','active','suspended','rejected')),
  rating numeric default 0,
  reviews_count integer default 0,
  trips_count integer default 0,
  hourly_rate integer default 99,
  languages text[] default '{}',
  specialties text[] default '{}',
  bio text,
  years_experience text,
  available boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.guide_profiles enable row level security;
drop policy if exists "Anyone can view active guide profiles" on public.guide_profiles;
drop policy if exists "Guides manage own profile" on public.guide_profiles;
create policy "Anyone can view active guide profiles" on public.guide_profiles for select using (true);
create policy "Guides manage own profile" on public.guide_profiles for update using (auth.uid() = id);
create policy "Guides insert own profile" on public.guide_profiles for insert with check (auth.uid() = id);

-- 3. Bookings (columns match what the frontend actually writes/reads)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  traveller_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('guide', 'hostel')),
  guide_id text,
  hostel_id text,
  city text,
  booking_date date not null,
  hours integer,
  amount integer not null,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  payment_method text check (payment_method in ('upi', 'cash')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  payment_ref text,
  created_at timestamp with time zone default now()
);
alter table public.bookings enable row level security;
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Users can insert own bookings" on public.bookings;
drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = traveller_id);
create policy "Users can insert own bookings" on public.bookings for insert with check (auth.uid() = traveller_id);
create policy "Users can update own bookings" on public.bookings for update using (auth.uid() = traveller_id);

-- 3b. Live trip location sharing — one row per active trip, latest
-- position only. The link is the access control: id is an unguessable
-- uuid, select is public so family members (no account) can open the
-- share link and see it update.
create table if not exists public.live_trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  latitude numeric,
  longitude numeric,
  accuracy_m numeric,
  last_updated timestamp with time zone default now(),
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone
);
alter table public.live_trips enable row level security;
drop policy if exists "Anyone with the link can view a trip" on public.live_trips;
drop policy if exists "Users manage own trips" on public.live_trips;
drop policy if exists "Users update own trips" on public.live_trips;
create policy "Anyone with the link can view a trip" on public.live_trips for select using (true);
create policy "Users manage own trips" on public.live_trips for insert with check (auth.uid() = user_id);
create policy "Users update own trips" on public.live_trips for update using (auth.uid() = user_id);
create index if not exists live_trips_user_id_idx on public.live_trips(user_id);
create index if not exists live_trips_booking_id_idx on public.live_trips(booking_id);

-- 4. Emergency contacts (for SOS)
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_name text not null,
  contact_phone text not null,
  created_at timestamp with time zone default now()
);
alter table public.emergency_contacts enable row level security;
drop policy if exists "Users manage own emergency contacts" on public.emergency_contacts;
create policy "Users manage own emergency contacts" on public.emergency_contacts for all using (auth.uid() = user_id);

-- 5. SOS alerts
create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  latitude numeric,
  longitude numeric,
  location_label text,
  status text not null default 'active' check (status in ('active','responding','resolved')),
  responded_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);
alter table public.sos_alerts enable row level security;
drop policy if exists "Users manage own sos alerts" on public.sos_alerts;
create policy "Users manage own sos alerts" on public.sos_alerts for all using (auth.uid() = user_id);

-- 6. Waitlist (public landing page, kept as-is)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  city text,
  created_at timestamp with time zone default now()
);
alter table public.waitlist enable row level security;
drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist" on public.waitlist for insert with check (true);

-- ════════════════════════════════════════════════════════════
-- Storage: avatars bucket (public, for onboarding profile photos)
-- ════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
