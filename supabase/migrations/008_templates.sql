create table if not exists templates (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 240),
  config      jsonb not null,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_templates_owner_id on templates(owner_id);
create index if not exists idx_templates_public on templates(is_public, updated_at desc);

alter table templates enable row level security;

drop policy if exists "public templates are readable" on templates;
create policy "public templates are readable"
  on templates for select
  using (is_public = true or auth.uid() = owner_id);

drop policy if exists "owners create own templates" on templates;
create policy "owners create own templates"
  on templates for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "owners update own templates" on templates;
create policy "owners update own templates"
  on templates for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners delete own templates" on templates;
create policy "owners delete own templates"
  on templates for delete to authenticated
  using (auth.uid() = owner_id);
