alter table templates add column if not exists views integer not null default 0;
alter table templates add column if not exists uses integer not null default 0;

create or replace function increment_template_stat(p_template_id uuid, p_field text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_field = 'uses' then
    update templates set uses = uses + 1 where id = p_template_id and is_public = true;
  elsif p_field = 'views' then
    update templates set views = views + 1 where id = p_template_id;
  end if;
end;
$$;

grant execute on function increment_template_stat(uuid, text) to anon, authenticated, service_role;
