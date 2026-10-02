-- Sauce v1 - Initial Schema
-- Source: sauce-v1-spec.md §3
-- Run in Supabase SQL editor in order. Idempotent where possible.

-- ============================================
-- profiles: one per authenticated user
-- ============================================
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  active_page_id  uuid,
  plan            text not null default 'free' check (plan in ('free', 'paid')),
  discord_id      text,
  discord_avatar_url text,
  created_at      timestamptz not null default now()
);

-- ============================================
-- pages: many per profile
-- ============================================
create table if not exists pages (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references profiles(id) on delete cascade,
  title             text not null default 'Untitled Page',
  draft_config      jsonb not null default '{}'::jsonb,
  live_config       jsonb,
  draft_updated_at  timestamptz not null default now(),
  published_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- add the FK from profiles -> pages now that pages exists (ignore if exists)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'fk_active_page') then
    alter table profiles
      add constraint fk_active_page
      foreign key (active_page_id) references pages(id) on delete set null;
  end if;
end $$;

create index if not exists idx_pages_profile_id on pages(profile_id);

-- ============================================
-- page_views: insert-only log, count(*) for totals
-- ============================================
create table if not exists page_views (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references profiles(id) on delete cascade,
  page_id     uuid references pages(id) on delete set null,
  viewed_at   timestamptz not null default now()
);

create index if not exists idx_page_views_profile_id on page_views(profile_id);
create index if not exists idx_page_views_viewed_at on page_views(viewed_at);

-- ============================================
-- Plan limits
-- ============================================
create or replace function get_page_limit(user_plan text)
returns int
language sql
immutable
as $$
  select case user_plan
    when 'free' then 1
    when 'paid' then 10
    else 1
  end;
$$;

create or replace function check_page_limit()
returns trigger
language plpgsql
as $$
declare
  current_count int;
  max_allowed int;
  user_plan text;
begin
  select plan into user_plan from profiles where id = new.profile_id;
  select get_page_limit(user_plan) into max_allowed;
  select count(*) into current_count from pages where profile_id = new.profile_id;

  if current_count >= max_allowed then
    raise exception 'page_limit_reached';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_page_limit on pages;
create trigger enforce_page_limit
  before insert on pages
  for each row execute function check_page_limit();

-- ============================================
-- Publish mechanic (atomic)
-- ============================================
create or replace function publish_page(p_page_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_profile_id uuid;
begin
  select profile_id into v_profile_id from pages where id = p_page_id;

  if not exists (
    select 1 from pages p
    join profiles pr on pr.id = p.profile_id
    where p.id = p_page_id and pr.id = auth.uid()
  ) then
    raise exception 'not_authorized';
  end if;

  update pages
    set live_config = draft_config,
        published_at = now()
    where id = p_page_id;

  update profiles
    set active_page_id = p_page_id
    where id = v_profile_id;
end;
$$;

-- ============================================
-- RLS Policies
-- ============================================
alter table profiles enable row level security;
alter table pages enable row level security;
alter table page_views enable row level security;

drop policy if exists "profiles are publicly readable" on profiles;
create policy "profiles are publicly readable"
  on profiles for select using (true);

drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "users can insert own profile" on profiles;
create policy "users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "owner full access" on pages;
create policy "owner full access"
  on pages for all using (auth.uid() = (select id from profiles where id = pages.profile_id));

drop policy if exists "anyone can log a view" on page_views;
create policy "anyone can log a view"
  on page_views for insert with check (true);

drop policy if exists "owner can read own views" on page_views;
create policy "owner can read own views"
  on page_views for select using (
    auth.uid() = (select id from profiles where id = page_views.profile_id)
  );

-- ============================================
-- Public view - safe read of live page
-- ============================================
create or replace view public_pages as
  select
    pr.username,
    p.id as page_id,
    p.live_config,
    pr.id as profile_id
  from profiles pr
  join pages p on p.id = pr.active_page_id
  where p.live_config is not null;

grant select on public_pages to anon, authenticated;

-- ============================================
-- Storage buckets
-- Note: create via Supabase Dashboard or storage API if not exists.
-- Buckets: avatars, backgrounds, audio (all public)
-- Bucket policies:
--   authenticated can write only to own {profile_id} prefix:
--     storage.foldername(name)[1] = auth.uid()::text
--   all buckets publicly readable
-- ============================================
-- Run these in dashboard or via SQL if storage schema is accessible:
-- insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('backgrounds','backgrounds', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('audio','audio', true) on conflict do nothing;

-- Storage policies (requires storage.objects RLS)
-- Uncomment after buckets exist:
-- create policy "authenticated can upload own avatar"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'avatars' and storage.foldername(name)[1] = auth.uid()::text);
-- create policy "public can read avatars"
--   on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
-- etc. for backgrounds/audio - see spec §3 storage prefixes.
