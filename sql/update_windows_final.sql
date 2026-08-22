-- Run this in the same Supabase SQL Editor, after the earlier seed/link scripts.
-- Supersedes sql/update_windows_links.sql's link values with the canonical
-- item URLs (more reliable than the short facebook.com/share/ links), adds
-- the real downloaded photos now committed at img/windows/*.jpg, and swaps
-- in a real retail price for the one listing where an exact model was found.
--
-- Source for all of this: Facebook's own "Boost listing" ad-preview data for
-- each listing (read via network request, not scraped/guessed) -- confirmed
-- against the actual listing photos, which show visible brand tags:
--   - 30x56 and 32x72: "Andersen" printed directly on the window/box
--   - 32x62: a red "MI / By MITER Brands" tag on the glass
-- Read 2026-08-22.

update public.windows set
    img = 'img/windows/24x38.jpg',
    brand = 'American Craftsman',
    model = '70 Pro Series (23.75 in x 37.25 in nominal)',
    retail_price = 219,  -- real Home Depot price for this exact model (SKU 204814543), not a generic estimate
    link = 'https://www.facebook.com/marketplace/item/2284681942296247/'
where name = '24x38 Window';

update public.windows set
    img = 'img/windows/30x56.jpg',
    brand = 'Andersen',
    link = 'https://www.facebook.com/marketplace/item/1033340299583825/'
where name = '30x56 Window';

update public.windows set
    img = 'img/windows/32x72.jpg',
    brand = 'Andersen',
    link = 'https://www.facebook.com/marketplace/item/1085106687308768/'
where name = '32x72 Window';

update public.windows set
    img = 'img/windows/38x54.jpg',
    link = 'https://www.facebook.com/marketplace/item/1078769911259451/'
where name = '38x54 Window';

update public.windows set
    img = 'img/windows/32x62.jpg',
    brand = 'MI Windows and Doors',
    link = 'https://www.facebook.com/marketplace/item/1820432569762138/'
where name = '32x62 Window';
