-- Run this once in the Supabase SQL Editor for the "AMAZON" project
-- (org "Need"):
--   https://supabase.com/dashboard/project/qgtcbwgjmpvslytxywju/sql/new
--
-- Creates a dedicated `windows` table, separate from `items`, with
-- fields for exact model + retail price so the site can show a
-- "you save $X" comparison to customers.
--
-- Note: this project also holds bookkeeping tables (bank transactions,
-- PayPal refunds, Amazon order records) with RLS disabled on them. Putting
-- `windows` here means this project's anon key ends up in the site's public
-- JS, same as those other tables already reachable via that key. That
-- tradeoff was discussed and accepted -- see docs/database-setup.md.

create table if not exists public.windows (
    id              bigint generated always as identity primary key,
    created_at      timestamptz not null default now(),
    name            text not null,                 -- e.g. "White Vinyl Double-Hung Window"
    brand           text,                           -- e.g. "Pella", "Andersen", "ProVia"
    model           text,                           -- exact model / series number
    window_type     text,                           -- "Double-Hung", "Slider", "Casement", "Picture", etc.
    frame_material  text,                           -- "Vinyl", "Wood", "Fiberglass", "Aluminum"
    glass_type      text,                           -- e.g. "Double-pane Low-E, argon-filled"
    width_in        numeric,                        -- width in inches
    height_in       numeric,                        -- height in inches
    condition       text default 'New',             -- "New", "New in box", "Open box", "Used"
    price           numeric,                        -- your selling price
    retail_price    numeric,                        -- typical retail/MSRP, used to show savings
    quantity        integer default 0,
    upc             text,
    img             text,
    link            text,                           -- source listing / spec sheet link
    tags            text,                           -- comma-separated, same convention as `items`
    notes           text
);

-- Row Level Security: mirrors the permissive setup already used on `items`
-- (public anon key can read and write, same as admin.html/addItems.js).
-- If you'd rather lock down writes later, drop the insert/update/delete
-- policies below and write through an authenticated/service key instead.
alter table public.windows enable row level security;

create policy "Public read access" on public.windows
    for select using (true);

create policy "Public insert access" on public.windows
    for insert with check (true);

create policy "Public update access" on public.windows
    for update using (true);

create policy "Public delete access" on public.windows
    for delete using (true);
