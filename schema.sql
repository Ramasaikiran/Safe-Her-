-- SafeShe Supabase Schema
-- Run this in your Supabase SQL editor

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  city text,
  created_at timestamp with time zone default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('guide', 'hostel', 'guard')) not null,
  reference_id text not null,
  date date not null,
  status text check (status in ('pending', 'confirmed', 'cancelled')) default 'confirmed',
  total_amount integer not null,
  notes text,
  created_at timestamp with time zone default now()
);
alter table public.bookings enable row level security;
create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can insert own bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users can update own bookings" on public.bookings for update using (auth.uid() = user_id);

-- 3. Waitlist
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  city text,
  created_at timestamp with time zone default now()
);
alter table public.waitlist enable row level security;
create policy "Anyone can join waitlist" on public.waitlist for insert with check (true);
