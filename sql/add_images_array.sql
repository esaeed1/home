-- Run once in the AMAZON project's SQL Editor. Adds a multi-photo column
-- alongside the existing single `img` (kept as the primary/first photo for
-- backward compatibility with anything still reading just that field).
alter table public.windows add column if not exists images text[];
