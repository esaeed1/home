-- Run this AFTER seed_windows_from_marketplace.sql, same SQL Editor.
-- Adds the direct Facebook Marketplace link to each row so clicking a
-- product card on windows.html takes the customer to that listing
-- (js/getItemsWindows.js already opens `item.link` in a new tab on click --
-- it was just null until now).
--
-- Also fills in `brand` for the two listings that actually showed a brand
-- name (in the boosted-ad preview text and in a product photo,
-- respectively) -- read on 2026-08-22, not looked up from a model number.

update public.windows set link = 'https://www.facebook.com/marketplace/item/2284681942296247/', brand = 'American Craftsman' where name = '24x38 Window';
update public.windows set link = 'https://www.facebook.com/marketplace/item/1033340299583825/' where name = '30x56 Window';
update public.windows set link = 'https://www.facebook.com/share/195vNPDSV6/', brand = 'Andersen' where name = '32x72 Window';
update public.windows set link = 'https://www.facebook.com/share/1NrTtjiqbQ/' where name = '38x54 Window';
update public.windows set link = 'https://www.facebook.com/share/1Cynydh1L1/' where name = '32x62 Window';
