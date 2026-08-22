# Database Setup

## Status

`windows.html` reads from the `windows` table in the **AMAZON** Supabase
project (org "Need", ref `qgtcbwgjmpvslytxywju`). This was a deliberate
choice, not a default -- see "The AMAZON project tradeoff" below before
adding anything else to this project.

**One-time schema setup** (only needed once, from scratch): run
[`sql/create_windows_table.sql`](../sql/create_windows_table.sql) in that
project's SQL Editor. `sql/seed_windows_from_marketplace.sql` and
`sql/update_windows_final.sql` were the original one-time bootstrap (run
2026-08-22) -- they're safe to leave alone, superseded by the automated sync
below for anything ongoing.

**Ongoing sync (automated):** [`scripts/sync-windows.mjs`](../scripts/sync-windows.mjs)
re-reads the seller's public Facebook Marketplace profile
(`https://www.facebook.com/marketplace/profile/61577791847468`) and
upserts every window listing into the table -- name, price, dimensions,
quantity, a downloaded copy of the photo, a best-effort brand guess, and the
listing description as `notes`. **No Facebook login or cookies are used or
stored anywhere** -- the profile page and each listing page render publicly
for a real (even logged-out) browser; only a plain HTTP request without a
real browser engine gets blocked. Verified by hand and by repeated test runs
on 2026-08-22.

It runs via [`.github/workflows/sync-windows.yml`](../.github/workflows/sync-windows.yml)
every 2 days (`0 6 */2 * *` UTC), or on demand from the Actions tab
("Run workflow"). It needs two repo secrets, which are **not** set yet --
add them at *Settings → Secrets and variables → Actions → New repository
secret*:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | `https://qgtcbwgjmpvslytxywju.supabase.co` |
| `SUPABASE_ANON_KEY` | the anon key from `js/getItemsWindows.js` |

(Neither is sensitive on its own -- the anon key is already public in the
site's client-side JS -- keeping them as secrets just avoids hardcoding them
into the workflow file.)

To run it locally instead: `SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run sync-windows`
(needs `npx playwright install chromium` once first).

**What it won't do:** delete rows for listings that get taken down (it only
inserts/updates what it finds), or fill in `retail_price` (that needs an
exact brand+model retail lookup, which varies too much to automate reliably
-- do that one by hand when it matters for the savings badge). It also can't
reliably tell apart the seller's own listings from Facebook's unrelated
"today's picks" on the same page via DOM structure (Facebook's CSS classes
are obfuscated/atomic, no stable container to scope by) -- it filters instead
by content: a listing is treated as ours only if its title contains "window"
or is a bare `WxH` dimension. If a future listing's title doesn't match
either pattern, it'll be silently skipped -- check `window_type`/title
conventions stay consistent, or loosen the `isWindowTitle()` check in the
script.

If you have old rows in the original windows-only project
(`pekbsvqrxxxusstbiuuv`) that predate all of this, `migrate-windows.html` is
a one-time tool to copy them across -- only run it if the sync script above
hasn't already picked up the same items, or you'll get duplicates.

## The AMAZON project tradeoff

The AMAZON project also holds bookkeeping tables -- `chase_transactions`,
`chase_balance_snapshots`, `paypal_refunds`, `mercury_transactions`,
`manual_refunds`, `order_metadata` -- with Row Level Security **disabled**
("Unrestricted" in the dashboard). Putting `windows` in this project means
its anon key has to live in `windows.html`'s public JavaScript, and that same
key can also read/write those unrestricted financial tables via Supabase's
REST API, since anon keys aren't scoped per-table.

This was flagged and knowingly accepted (2026-08-22) rather than fixed. If
that changes, the fix is to enable RLS on those tables with policies that
only allow the intended access (e.g. restricted to a service key / your own
login), independent of anything to do with `windows`.

## Overview

This site is static HTML/JS/CSS with no server of its own -- every page that
lists products talks directly to [Supabase](https://supabase.com) (hosted
Postgres + a REST API) from the browser, using the `@supabase/supabase-js`
client loaded from a CDN in each page's `<script type="module">`.

There is **no single database** -- different pages point at different
Supabase projects. That's intentional (each catalog is independent), but it
means "the database" always means a specific project + table. This doc lists
what exists today.

## Existing projects/tables

| Page | Script | Supabase project ref | Dashboard name (org) | Table |
|---|---|---|---|---|
| `items.html`, `admin.html` (Amazon resale catalog) | `js/getItems.js`, `js/addItems.js` | `ymyztsxdqmiklnsjurhq` | unconfirmed -- not reachable from the dashboard session used on 2026-08-22 (see below) | `items` |
| `ed.html` | `js/getItemsEd.js` | `mkiibbudnddkvuzwlsfr` | unconfirmed | `items` |
| `need.html` | `js/need.js` | `oaoigvrysdzdrkbdgweu` | "What I Need" (org "Need") | (needs list) |
| `windows.html` (**old**, pre-migration, no longer used) | -- | `pekbsvqrxxxusstbiuuv` | unconfirmed | `items` |
| `windows.html` (**current**) | `js/getItemsWindows.js` | `qgtcbwgjmpvslytxywju` | "AMAZON" (org "Need") | `windows` |

**Naming trap:** the dashboard project named "AMAZON" (`qgtcbwgjmpvslytxywju`)
is *not* the same project `items.html`/`admin.html` use (`ymyztsxdqmiklnsjurhq`)
-- despite the name, it was originally a bookkeeping database (bank
transactions, PayPal refunds, Amazon order records), not a product catalog.
`windows.html` was deliberately pointed at it anyway (see "The AMAZON project
tradeoff" above); `items.html` was not touched and still points at
`ymyztsxdqmiklnsjurhq`, which was never confirmed reachable from the
Supabase login used while doing this -- if you ever need to edit the items
catalog's schema, you may hit the same login mismatch.

Every project uses only the **anon public key** client-side -- there's no
secret/service key anywhere in this repo, which is correct: anon keys are
meant to be public. Row Level Security (RLS) policies on each table control
what the anon key can actually do. On `items` and `windows`, RLS is set to
allow public read *and* write, which is how `admin.html` and the "Add Item"
flows are able to insert/update without a login. If you ever want the public
site to be read-only, tighten the `insert`/`update`/`delete` policies on the
table and write through an authenticated key instead.

## The `windows` table

Added so windows have their own schema (brand, model, dimensions, retail
price) instead of sharing the generic `items` shape, and so the site can show
customers how much they're saving vs. retail.

**Setup:** see "Status" at the top of this document.

**Columns:**

| Column | Purpose |
|---|---|
| `name` | Display title |
| `brand`, `model` | Manufacturer + exact model/series, e.g. "Pella 250 Series" -- fill these in so the savings math below has something to compare against |
| `window_type` | Double-Hung, Slider, Casement, Picture, etc. |
| `frame_material`, `glass_type` | Spec details shown on the product card |
| `width_in`, `height_in` | Dimensions in inches |
| `condition` | New, New in box, Open box, Used |
| `price` | Your selling price |
| `retail_price` | Typical retail/MSRP for that exact brand + model + size, looked up online -- when set, the site automatically shows a "Save $X (Y% off $Z retail)" badge on the card |
| `quantity`, `upc`, `img`, `link`, `tags`, `notes` | Same convention as the `items` table |

To show a savings badge on a listing, both `price` and `retail_price` need to
be filled in -- `retail_price` is not looked up automatically, since that
requires knowing the exact brand/model, which varies per window.

## Adding a new catalog/table in the future

1. Decide whether it belongs in an existing project (as a new table, like
   `windows`) or needs its own project. Prefer a new table in an existing
   project unless there's a real reason to isolate it (separate billing,
   separate access control, etc.) -- fewer projects is less to keep track of.
2. Write the `CREATE TABLE` + RLS policies as a `.sql` file in `sql/`, same
   pattern as `create_windows_table.sql`.
3. Copy `js/getItemsWindows.js` as a starting point for the fetch/display
   script, point it at the right project URL/anon key and `.from('table_name')`.
4. Document the new table in the table above.
