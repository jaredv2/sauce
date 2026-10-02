-- Sauce v1 - Grants
-- Run AFTER 001_initial_schema.sql / 002_storage.sql
-- Ensures anon/authenticated can hit the view, tables (via RLS), and RPCs.
-- Supabase already grants a lot by default, but re-granting is idempotent and fixes missing GRANT on public_pages/function.

-- Schema usage
grant usage on schema public to anon, authenticated, service_role;

-- Tables - RLS still enforces row-level, but GRANT is required for the role to even reach RLS
grant select, insert, update, delete on table profiles to authenticated, service_role;
grant select on table profiles to anon; -- needed for username -> active_page_id resolution via public read policy

grant select, insert, update, delete on table pages to authenticated, service_role;
-- no anon grant on pages - public must go through public_pages view only

grant insert on table page_views to anon, authenticated, service_role; -- anyone can log a view
grant select on table page_views to authenticated, service_role;        -- owner can read own views (RLS)

-- View - public read via anon + authenticated
grant select on table public_pages to anon, authenticated, service_role;

-- Sequences (page_views.id is GENERATED ALWAYS AS IDENTITY)
grant usage, select on sequence page_views_id_seq to anon, authenticated, service_role;

-- Functions
grant execute on function get_page_limit(text) to anon, authenticated, service_role;

grant select, insert, update, delete on table templates to authenticated, service_role;
grant execute on function publish_page(uuid) to authenticated, service_role;

-- Storage schema usage (if you want anon to read public buckets via policies)
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on table storage.objects to anon, authenticated, service_role;
grant select, insert, update, delete on table storage.buckets to anon, authenticated, service_role;
