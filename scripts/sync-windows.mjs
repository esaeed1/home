// Syncs the `windows` Supabase table from the public Facebook Marketplace
// seller profile -- no Facebook login required. Run manually with:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/sync-windows.mjs
// or via the "sync-windows" GitHub Actions workflow on a schedule.
//
// How it works: the seller's Marketplace profile page (and each individual
// listing page) renders publicly for a real logged-out browser -- verified
// by hand on 2026-08-22. A plain HTTP request (curl, fetch) gets blocked,
// but a real browser engine (this uses Playwright's headless Chromium)
// gets through fine. No credentials, cookies, or Facebook account of any
// kind are used or stored anywhere in this script.

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILE_URL = 'https://www.facebook.com/marketplace/profile/61577791847468';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '..', 'img', 'windows');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRAND_PATTERNS = [
    [/american\s*craftsman/i, 'American Craftsman'],
    [/\bandersen\b/i, 'Andersen'],
    [/\bpella\b/i, 'Pella'],
    [/\bprovia\b/i, 'ProVia'],
    [/\bmarvin\b/i, 'Marvin'],
    [/\bmilgard\b/i, 'Milgard'],
    [/\bsimonton\b/i, 'Simonton'],
    [/\bmi\b.{0,15}\bwindow/i, 'MI Windows and Doors'],
    [/\bmi\s*brand/i, 'MI Windows and Doors'],
];

function detectBrand(text) {
    for (const [pattern, brand] of BRAND_PATTERNS) {
        if (pattern.test(text)) return brand;
    }
    return null;
}

function parseDimensions(title) {
    // Matches "24*38", "24x38", "24 x 38", etc. Takes the first pair found.
    const m = title.match(/(\d{1,3})\s*[*x×]\s*(\d{1,3})/i);
    if (!m) return { width_in: null, height_in: null };
    return { width_in: Number(m[1]), height_in: Number(m[2]) };
}

function parseQuantity(title) {
    const m = title.match(/(\d+)\s*(?:same window|windows|x window)/i);
    return m ? Number(m[1]) : 1;
}

function slugFromTitle(title, itemId) {
    const dims = parseDimensions(title);
    if (dims.width_in && dims.height_in) {
        return `${dims.width_in}x${dims.height_in}`;
    }
    return `item-${itemId}`;
}

async function main() {
    await fs.mkdir(IMG_DIR, { recursive: true });

    const browser = await chromium.launch();
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' });

    console.log('Loading seller profile:', PROFILE_URL);
    await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for at least one listing link to render.
    await page.waitForSelector('a[href*="/marketplace/item/"]', { timeout: 30000 });

    // The profile page also renders unrelated "today's picks"/recommendation
    // cards (other sellers' nearby listings) using the exact same link
    // markup, mixed into the same page. Facebook's CSS classes are all
    // obfuscated, so instead of a stable class we scope by structure: find
    // the "{City}'s listings" heading, then walk up its ancestors until we
    // reach the first one that actually contains item links -- that's the
    // seller's own listings grid. This reliably excludes the recommendation
    // cards (verified by hand on 2026-08-24: 25 links on the full page,
    // 7 within this scoped container -- exactly this seller's own listings).
    const scopedCards = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let headingEl = null;
        while (walker.nextNode()) {
            if (/'s listings$/i.test(walker.currentNode.textContent.trim())) {
                headingEl = walker.currentNode.parentElement;
                break;
            }
        }
        if (!headingEl) return null;

        let container = headingEl;
        for (let i = 0; i < 30 && container; i++) {
            if (container.querySelectorAll('a[href*="/marketplace/item/"]').length > 0) break;
            container = container.parentElement;
        }
        if (!container) return null;

        return Array.from(container.querySelectorAll('a[href*="/marketplace/item/"]')).map((a) => ({
            href: a.getAttribute('href') || '',
            ariaLabel: a.getAttribute('aria-label') || '',
        }));
    });

    const allLinksOnPage = await page.$$eval('a[href*="/marketplace/item/"]', (anchors) => anchors.length);
    const allCards = scopedCards || [];

    // Previously this also required the title to look like a window
    // ("window" in the title, or a bare "WxH" dimension) to filter out the
    // recommendation-card noise above. Now that scoping is handled
    // structurally instead, that title filter is commented out -- every
    // listing in the seller's own grid gets synced, not just windows.
    // const isWindowTitle = (title) =>
    //     /window/i.test(title) || /^\d{1,3}\s*[*x×]\s*\d{1,3}\s*$/i.test(title.trim());

    const seen = new Set();
    const listings = [];
    for (const { href, ariaLabel } of allCards) {
        const idMatch = href.match(/\/marketplace\/item\/(\d+)/);
        if (!idMatch) continue;
        const id = idMatch[1];
        if (seen.has(id)) continue;

        // aria-label: "{title}, {price-or-FREE}, {city}, listing {id}"
        const parts = ariaLabel.split(',');
        const title = (parts[0] || '').trim();
        if (!title) continue; // if (!title || !isWindowTitle(title)) continue;

        seen.add(id);
        listings.push({ id, title, ariaLabel });
    }

    console.log(`Found ${allLinksOnPage} total marketplace card(s) on the page, ${allCards.length} in the seller's own listings grid, ${listings.length} synced.`);

    const results = [];

    for (const { id, title, ariaLabel } of listings) {
        const itemUrl = `https://www.facebook.com/marketplace/item/${id}/`;
        console.log('Reading listing', id, itemUrl);

        const itemPage = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' });

        // Network-response sniffing is racy (the image can load and finish
        // before the listener is fully attached, especially from cache), so
        // read the URL back out of the rendered DOM instead -- deterministic
        // once the page has loaded, since the photo has to be in the DOM to
        // be visible at all.
        await itemPage.goto(itemUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});

        // aria-label: "{title}, {price-or-FREE}, {city}, listing {id}"
        const priceMatch = ariaLabel.match(/\$([\d,]+)/);
        const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : null;

        const fullPageText = await itemPage.evaluate(() => document.body.innerText).catch(() => '');
        // The real per-listing description sits after a "Details" landmark
        // and before the "Related searches"/"Classifieds" sections that
        // follow it. Scoping to this window avoids both garbage notes (the
        // page starts with nav/sidebar text) and false-positive brand
        // matches from unrelated recommended listings further down the page.
        const detailsIdx = fullPageText.indexOf('\nDetails\n');
        const relatedIdx = fullPageText.indexOf('\nRelated searches');
        const description = detailsIdx >= 0
            ? fullPageText.slice(detailsIdx, relatedIdx > detailsIdx ? relatedIdx : detailsIdx + 500)
            : fullPageText.slice(0, 500);
        const condition = /condition\s*\n?\s*new/i.test(description) ? 'New' : null;

        // Below the actual listing, Facebook renders a "related/recommended"
        // section full of OTHER sellers' photos -- and those can use the
        // exact same internal media type (t45.5328) as this listing's own
        // photos, so filtering by that type alone isn't safe (verified by
        // hand: a stranger's gaming PC listing, a mattress ad, and a
        // locksmith ad all rendered as t45.5328 on other items' pages). The
        // reliable signal is the alt text Facebook itself sets only on this
        // listing's own gallery images: exactly "Product photo of {title}".
        // Dedupe by media id (the number right before "_<fbid>_<random>_n.jpg"
        // in the filename), since the same photo can appear multiple times
        // at different crop sizes.
        const mediaId = (url) => (url.match(/\/(\d+)_\d+_\d+_n\.(?:jpg|webp)/) || [])[1] || url;

        const { ogImage, galleryImages } = await itemPage.evaluate(() => {
            const og = document.querySelector('meta[property="og:image"]');
            const imgs = Array.from(document.querySelectorAll('img[alt^="Product photo of "]'));
            return { ogImage: og ? og.content : null, galleryImages: imgs.map((i) => i.src) };
        }).catch(() => ({ ogImage: null, galleryImages: [] }));

        const byMediaId = new Map();
        if (ogImage) byMediaId.set(mediaId(ogImage), ogImage);
        for (const src of galleryImages) {
            const key = mediaId(src);
            if (!byMediaId.has(key)) byMediaId.set(key, src);
        }
        const imageUrls = [...byMediaId.values()];

        await itemPage.close();

        const dims = parseDimensions(title);
        const quantity = parseQuantity(title);
        const brand = detectBrand(description) || detectBrand(title);
        const slug = slugFromTitle(title, id);

        const imgPaths = [];
        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const res = await page.request.get(imageUrls[i]);
                if (res.ok()) {
                    const buf = await res.body();
                    const filename = imageUrls.length > 1 ? `${slug}-${i + 1}.jpg` : `${slug}.jpg`;
                    await fs.writeFile(path.join(IMG_DIR, filename), buf);
                    imgPaths.push(`img/windows/${filename}`);
                }
            } catch (err) {
                console.warn('  photo download failed:', err.message);
            }
        }
        if (imgPaths.length) console.log(`  saved ${imgPaths.length} photo(s) -> ${imgPaths.join(', ')}`);

        results.push({
            listing_id: id,
            link: itemUrl,
            name: title,
            price,
            quantity,
            width_in: dims.width_in,
            height_in: dims.height_in,
            brand,
            condition,
            img: imgPaths[0] || null,
            images: imgPaths.length ? imgPaths : null,
            notes: description.slice(0, 500),
        });
    }

    await browser.close();

    console.log(`\nUpserting ${results.length} listing(s) into Supabase...`);

    for (const r of results) {
        const { data: existing, error: selErr } = await supabase
            .from('windows')
            .select('id')
            .eq('link', r.link)
            .maybeSingle();

        if (selErr) {
            console.error('  select error for', r.link, selErr.message);
            continue;
        }

        const row = {
            name: r.name,
            price: r.price,
            quantity: r.quantity,
            width_in: r.width_in,
            height_in: r.height_in,
            link: r.link,
            notes: r.notes,
        };
        if (r.brand) row.brand = r.brand;
        if (r.condition) row.condition = r.condition;
        if (r.img) row.img = r.img; // only overwrite if we actually got a fresh photo this run
        if (r.images) row.images = r.images;

        if (existing) {
            const { error } = await supabase.from('windows').update(row).eq('id', existing.id);
            if (error) console.error('  update error for', r.link, error.message);
            else console.log('  updated:', r.name);
        } else {
            const { error } = await supabase.from('windows').insert(row);
            if (error) console.error('  insert error for', r.link, error.message);
            else console.log('  inserted:', r.name);
        }
    }

    console.log('\nDone. Listings no longer on the profile page were left as-is (not auto-deleted).');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
