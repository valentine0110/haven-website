-- Haven Property Co. — migration for the original shipped schema.
-- Use this file when the Supabase project already contains the old Haven tables.
-- For a brand-new project, run schema.sql instead.

create extension if not exists "pgcrypto";

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

-- Existing columns are preserved; these fields are needed by the new CMS.
alter table agents add column if not exists active boolean not null default true;
alter table agents add column if not exists updated_at timestamptz not null default now();

alter table properties add column if not exists show_map boolean not null default false;
alter table properties add column if not exists published_at timestamptz;
alter table properties add column if not exists updated_at timestamptz not null default now();
alter table properties alter column published set default false;
update properties set published_at = coalesce(published_at, created_at) where published = true and published_at is null;

alter table enquiries add column if not exists preferred_date date;
alter table enquiries add column if not exists preferred_time time;
alter table enquiries add column if not exists assigned_agent_id text references agents(id) on delete set null;
alter table enquiries add column if not exists internal_notes text;
alter table enquiries add column if not exists updated_at timestamptz not null default now();

-- The original schema only documented enquiry statuses in a comment, so there is
-- normally no old check constraint to remove. Replace our own named constraint safely.
alter table enquiries drop constraint if exists enquiries_status_check;
alter table enquiries add constraint enquiries_status_check
  check (status in ('New', 'Contacted', 'Viewing requested', 'Qualified', 'Closed', 'Lost'));

create index if not exists agents_active_idx on agents (active);
create index if not exists properties_availability_idx on properties (availability);
create index if not exists properties_featured_idx on properties (featured);
create index if not exists properties_updated_idx on properties (updated_at desc);
create index if not exists enquiries_status_idx on enquiries (status);
create index if not exists enquiries_created_idx on enquiries (created_at desc);
create index if not exists enquiries_property_idx on enquiries (property_id);
create index if not exists enquiries_agent_idx on enquiries (assigned_agent_id);

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media', 'property-media', true, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 12582912, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

alter table staff_profiles enable row level security;
alter table agents enable row level security;
alter table properties enable row level security;
alter table enquiries enable row level security;

drop policy if exists "staff can read own profile" on staff_profiles;
create policy "staff can read own profile" on staff_profiles for select using (auth.uid() = user_id);

drop policy if exists "public can read agents" on agents;
drop policy if exists "public can read active agents" on agents;
drop policy if exists "staff can manage agents" on agents;
create policy "public can read active agents" on agents for select using (active = true);
create policy "staff can manage agents" on agents for all using (public.is_staff('admin')) with check (public.is_staff('admin'));

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

-- Public API surface: the raw properties table is no longer publicly readable.
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
drop policy if exists "staff can read enquiries" on enquiries;
drop policy if exists "staff can update enquiries" on enquiries;
create policy "public can submit enquiries" on enquiries for insert with check (
  char_length(trim(name)) between 2 and 100
  and char_length(trim(email)) between 3 and 254
  and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  and char_length(coalesce(message, '')) <= 4000
  and (property_id is null or exists (select 1 from public.public_properties pp where pp.id = property_id))
);
create policy "staff can read enquiries" on enquiries for select using (public.is_staff());
create policy "staff can update enquiries" on enquiries for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "public can read property media" on storage.objects;
drop policy if exists "staff can upload property media" on storage.objects;
drop policy if exists "staff can update property media" on storage.objects;
drop policy if exists "staff can delete property media" on storage.objects;
create policy "public can read property media" on storage.objects for select using (bucket_id = 'property-media');
create policy "staff can upload property media" on storage.objects for insert with check (bucket_id = 'property-media' and public.is_staff());
create policy "staff can update property media" on storage.objects for update using (bucket_id = 'property-media' and public.is_staff());
create policy "staff can delete property media" on storage.objects for delete using (bucket_id = 'property-media' and public.is_staff('admin'));

-- After this migration, create/authorize your staff users:
-- insert into public.staff_profiles (user_id, full_name, role) values ('AUTH-USER-UUID-HERE', 'Your Name', 'owner');
