drop trigger if exists enforce_page_limit on pages;
drop function if exists check_page_limit();

drop policy if exists "pages insert within limit" on pages;

create or replace function get_page_limit(user_plan text)
returns int
language sql
immutable
as $$
  select 2147483647;
$$;
