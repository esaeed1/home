# Database Setup

## TODO -- one manual step left

The `windows` table isn't created yet. Everything else (SQL, seed data, code,
migration tool) is written and ready. To finish:

1. Log into the Supabase account that owns the **`ymyztsxdqmiklnsjurhq`**
   project (this is the project `items.html`/`admin.html`/`windows.html`
   actually read from -- see the note under "Existing projects/tables" below,
   there's a mixup risk here).
2. Open the SQL Editor for that project and run
   [`sql/create_windows_table.sql`](../sql/create_windows_table.sql).
3. Then run [`sql/seed_windows_from_marketplace.sql`](../sql/seed_windows_from_marketplace.sql)
   to load in the 5 windows currently listed on Facebook Marketplace (sizes,
   prices, and an estimated retail comparison -- see that file's comments,
   none of these listings had a brand/model to look up an exact price for).
4. If you also have old rows in the original windows-only project
   (`pekbsvqrxxxusstbiuuv`), open `migrate-windows.html` in a browser once
   and click "Run Migration" -- but only if you haven't already run the seed
   script above for the same items, or you'll get duplicates.
5. Reload `windows.html` -- it's already pointed at the new table, so it'll
   just start working once the table has data.

**Why this wasn't done automatically:** while working through this, I found
that the Supabase login active in the browser I was controlling only has
access to 3 projects -- a financial/bookkeeping database confusingly also
named "AMAZON" (bank transactions, PayPal refunds, Amazon order records --
NOT the item catalog), "What I Need", and "Blight". None of them is
`ymyztsxdqmiklnsjurhq`. I didn't want to guess at logging into a different
account, so this needs you.

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

| Page | Script | Supabase project ref | Table |
|---|---|---|---|
| `items.html`, `admin.html` (the Amazon resale catalog) | `js/getItems.js`, `js/addItems.js` | `ymyztsxdqmiklnsjurhq` | `items` |
| `ed.html` | `js/getItemsEd.js` | `mkiibbudnddkvuzwlsfr` | `items` |
| `need.html` | `js/need.js` | `oaoigvrysdzdrkbdgweu` (dashboard name: "What I Need", org "Need") | (needs list) |
| `windows.html` (**old**, pre-migration) | -- | `pekbsvqrxxxusstbiuuv` | `items` |
| `windows.html` (**current**) | `js/getItemsWindows.js` | `ymyztsxdqmiklnsjurhq` (same project as `items.html`) | `windows` |

**Naming trap:** there is a Supabase dashboard project literally named
"AMAZON" (ref `qgtcbwgjmpvslytxywju`, under the "Need" org) that is a
*different, unrelated* database -- it holds bank transactions, PayPal
refunds, and Amazon order/bookkeeping records, not the item catalog. The
catalog project (`ymyztsxdqmiklnsjurhq`) that this table refers to as "the
Amazon resale catalog" has never been confirmed reachable from a logged-in
dashboard session -- only its ref, as hardcoded in `js/getItems.js`, is
known. Don't assume the dashboard project named "AMAZON" is it.

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

**Setup (one-time, manual):** see the TODO checklist at the top of this
document -- it's the same steps, in order, with the reasoning for why it
couldn't be done automatically.

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
