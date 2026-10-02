alter table profiles add column if not exists verified_at timestamptz;

alter table profiles add column if not exists public_uid bigint;

create sequence if not exists profiles_public_uid_seq;

with ranked as (
  select id, row_number() over (order by created_at, id) as rn
  from profiles
  where public_uid is null
)
update profiles p
set public_uid = r.rn
from ranked r
where p.id = r.id;

alter table profiles alter column public_uid set default nextval('profiles_public_uid_seq');
alter table profiles alter column public_uid set not null;

create unique index if not exists idx_profiles_public_uid on profiles(public_uid);
