alter table profiles add column if not exists username_changed_at timestamptz;

update profiles
set username_changed_at = created_at
where username_changed_at is null;

create or replace function enforce_username_change_cooldown()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    if coalesce(old.username_changed_at, old.created_at) > now() - interval '14 days' then
      raise exception 'username_change_cooldown' using hint = 'Username can only be changed once every 14 days.';
    end if;
    new.username_changed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_username_cooldown on profiles;
create trigger profiles_username_cooldown
  before update of username on profiles
  for each row execute function enforce_username_change_cooldown();
