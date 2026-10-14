-- Create site_settings table for CMS (Hero banner & Offer popups)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  hero_image text,
  offer_enabled boolean not null default false,
  offer_image text,
  offer_link text,
  cities text[] default array['Mumbai', 'Pune', 'Bengaluru', 'Alibaug']::text[],
  updated_at timestamptz not null default now()
);

-- Ensure cities column exists if table was created previously without it
alter table public.site_settings add column if not exists cities text[] default array['Mumbai', 'Pune', 'Bengaluru', 'Alibaug']::text[];

-- Insert default single row
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- Enable RLS
alter table public.site_settings enable row level security;

-- Policies: anyone can read, only staff can update
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select using (true);

drop policy if exists "staff can update site settings" on public.site_settings;
create policy "staff can update site settings" on public.site_settings for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff can insert site settings" on public.site_settings;
create policy "staff can insert site settings" on public.site_settings for insert with check (public.is_staff());

-- Allow owner to manage staff_profiles
drop policy if exists "owner can manage staff_profiles" on public.staff_profiles;
create policy "owner can manage staff_profiles" on public.staff_profiles for all using (public.is_staff('owner')) with check (public.is_staff('owner'));
