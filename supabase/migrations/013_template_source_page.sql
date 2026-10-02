alter table templates add column if not exists source_page_id uuid references pages(id) on delete set null;

create index if not exists idx_templates_source_page on templates(source_page_id);
