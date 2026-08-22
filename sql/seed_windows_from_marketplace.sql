-- Run this AFTER create_windows_table.sql, in the same Supabase SQL Editor.
-- Seeds the new `windows` table with your 5 active Facebook Marketplace
-- listings (read from facebook.com/marketplace/you/selling on 2026-08-22).
--
-- IMPORTANT: none of these listings had a brand or model number in the
-- title/description/photo, so there is no "exact model" to look up.
-- retail_price below is a GENERIC estimate for a comparable new vinyl
-- window of that size (materials only, no installation), not a quote for
-- a specific manufacturer/model. It's built from an area-based rate
-- (~$0.15/sq in) benchmarked against several real sold prices for
-- materials-only vinyl double-hung/slider windows. Treat it as a
-- reasonable ballpark, not an exact figure -- if you ever learn the real
-- brand/model for any of these, replace the retail_price with a real
-- looked-up number instead.
--
-- Photos: Facebook's photo URLs require a logged-in session and won't
-- load as a public <img> on your site, so `img` is left blank here --
-- re-upload the photos somewhere public (e.g. your own image host) and
-- update the `img` column per row once you have URLs.

insert into public.windows (name, window_type, width_in, height_in, condition, price, retail_price, quantity, notes)
values
    ('24x38 Window', null, 24, 38, 'New', 160, 180, 1,
     'From Facebook Marketplace listing "24*38 Window", posted 8/22. retail_price is a generic size-based estimate, not brand-specific.'),

    ('30x56 Window', null, 30, 56, 'New', 200, 260, 1,
     'From Facebook Marketplace listing "30*56 window", posted 8/15, 18 clicks. retail_price is a generic size-based estimate, not brand-specific.'),

    ('32x72 Window', null, 32, 72, 'New', 350, 450, 2,
     'From Facebook Marketplace listing "32*72 (2x Same Window)", posted 8/15, 16 clicks -- listed as a pair for $700 total ($350/window). retail_price is a generic size-based estimate, not brand-specific.'),

    ('38x54 Window', null, 38, 54, 'New', 200, 310, 1,
     'From Facebook Marketplace listing "38*54", posted 8/15, 5 clicks. retail_price is a generic size-based estimate, not brand-specific.'),

    ('32x62 Window', null, 32, 62, 'New', 200, 300, 1,
     'From Facebook Marketplace listing "32*62 Window", posted 8/15, 15 clicks. retail_price is a generic size-based estimate, not brand-specific.');
