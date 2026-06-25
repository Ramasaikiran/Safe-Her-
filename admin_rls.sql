-- ════════════════════════════════════════════════════════════
-- SafeShe Admin RLS Policies
-- Run this in your Supabase SQL editor ONCE.
-- Replace nothing — it reads role = 'admin' from profiles.
-- 
-- Step 1: Run this SQL
-- Step 2: In Supabase → Auth → Users, find your user ID
-- Step 3: Run this update with your ID:
--   update public.profiles set role = 'admin' where id = 'YOUR-UUID-HERE';
-- Step 4: Go to yourdomain.com/admin
-- ════════════════════════════════════════════════════════════

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- ── profiles: admin can read ALL ──────────────────────────
drop policy if exists "admin_read_all_profiles" on public.profiles;
create policy "admin_read_all_profiles" on public.profiles
  for select using (public.is_admin());

drop policy if exists "admin_update_all_profiles" on public.profiles;
create policy "admin_update_all_profiles" on public.profiles
  for update using (public.is_admin());

-- ── guide_profiles: admin can read + update ALL ────────────
drop policy if exists "admin_read_all_guide_profiles" on public.guide_profiles;
create policy "admin_read_all_guide_profiles" on public.guide_profiles
  for select using (public.is_admin());

drop policy if exists "admin_update_all_guide_profiles" on public.guide_profiles;
create policy "admin_update_all_guide_profiles" on public.guide_profiles
  for update using (public.is_admin());

-- ── bookings: admin can read ALL ──────────────────────────
drop policy if exists "admin_read_all_bookings" on public.bookings;
create policy "admin_read_all_bookings" on public.bookings
  for select using (public.is_admin());

drop policy if exists "admin_update_all_bookings" on public.bookings;
create policy "admin_update_all_bookings" on public.bookings
  for update using (public.is_admin());

-- ── guide_reports: admin can read ALL ─────────────────────
drop policy if exists "admin_read_all_reports" on public.guide_reports;
create policy "admin_read_all_reports" on public.guide_reports
  for select using (public.is_admin());

-- ── sos_alerts: admin can read ALL ────────────────────────
drop policy if exists "admin_read_all_sos" on public.sos_alerts;
create policy "admin_read_all_sos" on public.sos_alerts
  for select using (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- After running: set your account as admin
-- update public.profiles set role = 'admin' where id = 'YOUR-UUID';
-- ════════════════════════════════════════════════════════════
