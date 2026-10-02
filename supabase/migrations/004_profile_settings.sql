alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists bio text;

alter table profiles add column if not exists page_visibility text not null default 'public';
alter table profiles add column if not exists analytics_enabled boolean not null default true;
alter table profiles add column if not exists discoverable boolean not null default true;

alter table profiles add column if not exists default_background_effect text not null default 'none';
alter table profiles add column if not exists default_show_separator boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_page_visibility_check'
  ) then
    alter table profiles
      add constraint profiles_page_visibility_check
      check (page_visibility in ('public', 'unlisted', 'private'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_default_background_effect_check'
  ) then
    alter table profiles
      add constraint profiles_default_background_effect_check
      check (default_background_effect in ('none', 'blur', 'dark-overlay', 'gradient', 'frosted', 'black-and-white'));
  end if;
end;
$$;
