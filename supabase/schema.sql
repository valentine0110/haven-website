-- Haven Property Co. — production-ready schema for a small brokerage (100–200 listings).
-- Run in a fresh Supabase project or migrate existing columns/table definitions first.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Staff authorization
-- Create users in Supabase Auth, then add their user id here.
-- ---------------------------------------------------------------------------
create table if not exists staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists staff_profiles_active_idx on staff_profiles (active);

create or replace function public.is_staff(required_role text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and (
        required_role is null
        or sp.role = required_role
        or sp.role in ('owner', 'admin')
      )
  );
$$;

revoke all on function public.is_staff(text) from public;
grant execute on function public.is_staff(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Agents
-- ---------------------------------------------------------------------------
create table if not exists agents (
  id text primary key default ('a' || substr(gen_random_uuid()::text, 1, 8)),
  name text not null,
  role text not null,
  phone text not null,
  email text not null,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agents add column if not exists active boolean not null default true;
alter table agents add column if not exists created_at timestamptz not null default now();
alter table agents add column if not exists updated_at timestamptz not null default now();

create index if not exists agents_active_idx on agents (active);

-- ---------------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------------
create table if not exists properties (
  id text primary key default ('p' || substr(gen_random_uuid()::text, 1, 8)),
  slug text unique not null,
  title text not null check (char_length(trim(title)) >= 3),
  property_type text not null check (property_type in ('Apartment', 'House', 'Villa', 'Studio', 'Penthouse', 'Plot')),
  status text not null check (status in ('For sale', 'For rent')),
  price numeric not null check (price > 0),
  location text not null,
  city text not null,
  address text not null,
  area integer not null check (area > 0),
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  floor integer check (floor >= 0),
  total_floors integer check (total_floors is null or total_floors >= 1),
  furnishing text not null default 'Unfurnished' check (furnishing in ('Unfurnished', 'Semi-furnished', 'Furnished')),
  parking integer not null default 0 check (parking >= 0),
  description text not null default '',
  amenities text[] not null default '{}',
  image text,
  images text[] not null default '{}',
  floor_plan text,
  video_url text,
  lat double precision,
  lng double precision,
  show_map boolean not null default false,
  date_added date not null default current_date,
  featured boolean not null default false,
  availability text not null default 'Available' check (availability in ('Available', 'Under offer', 'Sold', 'Rented')),
  agent_id text references agents(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table properties add column if not exists show_map boolean not null default false;
alter table properties add column if not exists published_at timestamptz;
alter table properties add column if not exists updated_at timestamptz not null default now();

create index if not exists properties_published_idx on properties (published);
create index if not exists properties_city_idx on properties (city);
create index if not exists properties_status_idx on properties (status);
create index if not exists properties_availability_idx on properties (availability);
create index if not exists properties_featured_idx on properties (featured);
create index if not exists properties_updated_idx on properties (updated_at desc);

-- Keep updated timestamps and published_at consistent without trusting the client.
create or replace function public.touch_record()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if tg_table_name = 'properties' then
    if new.published = true then
      if new.agent_id is null then raise exception 'A published property must have an assigned agent.'; end if;
      if coalesce(array_length(new.images, 1), 0) = 0 and coalesce(trim(new.image), '') = '' then raise exception 'A published property must have at least one image.'; end if;
      if char_length(trim(new.description)) < 30 then raise exception 'A published property must have a description of at least 30 characters.'; end if;
      if not exists (select 1 from public.agents a where a.id = new.agent_id and a.active = true) then raise exception 'A published property must be assigned to an active agent.'; end if;
    end if;
    if tg_op = 'INSERT' then
      if new.published = true then new.published_at = coalesce(new.published_at, now()); end if;
    elsif new.published = true and old.published = false then
      new.published_at = coalesce(new.published_at, now());
    elsif new.published = false then
      new.published_at = null;
    end if;
  elsif tg_table_name = 'agents' then
    if new.active = false and old.active = true and exists (select 1 from public.properties p where p.agent_id = new.id and p.published = true) then
      raise exception 'Reassign or unpublish this agent''s published listings before deactivation.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists properties_touch_record on properties;
create trigger properties_touch_record before update on properties for each row execute function public.touch_record();
drop trigger if exists properties_insert_defaults on properties;
create trigger properties_insert_defaults before insert on properties for each row execute function public.touch_record();
drop trigger if exists agents_touch_record on agents;
create trigger agents_touch_record before update on agents for each row execute function public.touch_record();

-- ---------------------------------------------------------------------------
-- Enquiries / simple lead pipeline
-- ---------------------------------------------------------------------------
create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id text references properties(id) on delete set null,
  property_title text,
  name text not null,
  phone text,
  email text not null,
  message text,
  source text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Viewing requested', 'Qualified', 'Closed', 'Lost')),
  preferred_date date,
  preferred_time time,
  assigned_agent_id text references agents(id) on delete set null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table enquiries add column if not exists preferred_date date;
alter table enquiries add column if not exists preferred_time time;
alter table enquiries add column if not exists assigned_agent_id text references agents(id) on delete set null;
alter table enquiries add column if not exists internal_notes text;
alter table enquiries add column if not exists updated_at timestamptz not null default now();

create index if not exists enquiries_status_idx on enquiries (status);
create index if not exists enquiries_created_idx on enquiries (created_at desc);
create index if not exists enquiries_property_idx on enquiries (property_id);
create index if not exists enquiries_agent_idx on enquiries (assigned_agent_id);

create or replace function public.prepare_enquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.property_title = null;
  new.assigned_agent_id = null;
  if new.property_id is not null then
    select p.title, p.agent_id
      into new.property_title, new.assigned_agent_id
      from public.properties p
     where p.id = new.property_id
       and p.published = true;
  end if;
  if new.preferred_date is not null or new.preferred_time is not null then
    new.status = 'Viewing requested';
  else
    new.status = 'New';
  end if;
  return new;
end;
$$;

drop trigger if exists enquiries_prepare on enquiries;
create trigger enquiries_prepare before insert on enquiries for each row execute function public.prepare_enquiry();
drop trigger if exists enquiries_touch_record on enquiries;
create trigger enquiries_touch_record before update on enquiries for each row execute function public.touch_record();

-- ---------------------------------------------------------------------------
-- Storage for property/agent media.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', true, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 12582912, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table staff_profiles enable row level security;
alter table agents enable row level security;
alter table properties enable row level security;
alter table enquiries enable row level security;

-- Staff users can only read their own staff profile. The SECURITY DEFINER helper
-- is used by the other policies and avoids recursive RLS checks.
drop policy if exists "staff can read own profile" on staff_profiles;
create policy "staff can read own profile" on staff_profiles for select using (auth.uid() = user_id);

drop policy if exists "public can read active agents" on agents;
create policy "public can read active agents" on agents for select using (active = true);
drop policy if exists "staff can manage agents" on agents;
create policy "staff can manage agents" on agents for all using (public.is_staff('admin')) with check (public.is_staff('admin'));

-- Raw property rows remain staff-only. Public pages use the safe view below.
drop policy if exists "public can read published properties" on properties;
drop policy if exists "staff can manage all properties" on properties;
drop policy if exists "staff can read properties" on properties;
drop policy if exists "staff can insert properties" on properties;
drop policy if exists "staff can update properties" on properties;
drop policy if exists "admin can delete properties" on properties;
create policy "staff can read properties" on properties for select using (public.is_staff());
create policy "staff can insert properties" on properties for insert with check (public.is_staff());
create policy "staff can update properties" on properties for update using (public.is_staff()) with check (public.is_staff());
create policy "admin can delete properties" on properties for delete using (public.is_staff('admin'));


-- Public API surface. This view deliberately omits the private address and only
-- exposes exact coordinates when staff explicitly enables approximate map display.
drop view if exists public.public_properties;
create view public.public_properties as
select
  id, slug, title, property_type, status, price, location, city, area, bedrooms, bathrooms,
  floor, total_floors, furnishing, parking, description, amenities, image, images, floor_plan,
  video_url,
  case when show_map = true then lat else null end as lat,
  case when show_map = true then lng else null end as lng,
  show_map, date_added, featured, availability, agent_id, published, published_at, updated_at
from public.properties
where published = true;

grant select on public.public_properties to anon, authenticated;

drop policy if exists "public can submit enquiries" on enquiries;
create policy "public can submit enquiries" on enquiries for insert with check (
  char_length(trim(name)) between 2 and 100
  and char_length(trim(email)) between 3 and 254
  and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  and char_length(coalesce(message, '')) <= 4000
  and (property_id is null or exists (select 1 from public.public_properties pp where pp.id = property_id))
);
drop policy if exists "staff can read enquiries" on enquiries;
create policy "staff can read enquiries" on enquiries for select using (public.is_staff());
drop policy if exists "staff can update enquiries" on enquiries;
create policy "staff can update enquiries" on enquiries for update using (public.is_staff()) with check (public.is_staff());

-- Storage: public reads, staff can upload/update; admins/owners can delete media.
drop policy if exists "public can read property media" on storage.objects;
create policy "public can read property media" on storage.objects for select using (bucket_id = 'property-media');
drop policy if exists "staff can upload property media" on storage.objects;
create policy "staff can upload property media" on storage.objects for insert with check (bucket_id = 'property-media' and public.is_staff());
drop policy if exists "staff can update property media" on storage.objects;
create policy "staff can update property media" on storage.objects for update using (bucket_id = 'property-media' and public.is_staff());
drop policy if exists "staff can delete property media" on storage.objects;
create policy "staff can delete property media" on storage.objects for delete using (bucket_id = 'property-media' and public.is_staff('admin'));

-- Demo content is intentionally kept out of the production schema.
-- Run supabase/seed.sql only when you want sample listings for a preview.
