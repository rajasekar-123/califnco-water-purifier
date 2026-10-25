// Finds openly licensed product-type photos on Wikimedia Commons.
//   node fetch-images.mjs                 all products
//   node fetch-images.mjs --only P001,P010
//   node fetch-images.mjs --refresh       re-search products already matched
// Output: images/<productId>.<ext> + images/manifest.json (attribution, source URL, licence, status)
// Products with no acceptable image get status "needs_review" and NO file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from './catalog.mjs';
import { ALLOWED_LICENSES, BLOCKED_LICENSES, GLOBAL_EXCLUDE, ruleFor } from './image-rules.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(dir, 'images');
const manifestPath = path.join(imgDir, 'manifest.json');
fs.mkdirSync(imgDir, { recursive: true });

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const refresh = args.includes('--refresh');
const UA = `CalifncoSeed/1.0 (${process.env.COMMONS_CONTACT || 'student-project; set COMMONS_CONTACT=you@example.com'})`;
const API = 'https://commons.wikimedia.org/w/api.php';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(params, tries = 4) {
  const u = new URL(API);
  Object.entries({ format: 'json', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  for (let i = 0; i < tries; i++) {
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (r.ok) return r.json();
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    throw new Error(`Commons API ${r.status}`);
  }
  throw new Error('Commons API unavailable');
}

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
const IMGINFO = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: 1000, iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription|AttributionRequired|Restrictions' };

function toCandidate(page) {
  const i = page.imageinfo?.[0];
  if (!i) return null;
  const m = i.extmetadata ?? {};
  return {
    title: page.title,
    mime: i.mime, width: i.width, height: i.height,
    thumbUrl: i.thumburl || i.url, fileUrl: i.url, sourceUrl: i.descriptionurl,
    license: strip(m.LicenseShortName?.value), licenseUrl: m.LicenseUrl?.value ?? '',
    author: strip(m.Artist?.value) || strip(m.Credit?.value) || 'Unknown',
    description: strip(m.ImageDescription?.value).slice(0, 200),
    restrictions: strip(m.Restrictions?.value),
  };
}

const searchCache = new Map();
async function search(q) {
  if (searchCache.has(q)) return searchCache.get(q);
  const j = await call({ action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: 6, gsrlimit: 25, ...IMGINFO });
  await sleep(250);
  const out = Object.values(j.query?.pages ?? {}).map(toCandidate).filter(Boolean);
  searchCache.set(q, out);
  return out;
}

async function byTitle(title) {
  const j = await call({ action: 'query', titles: title, ...IMGINFO });
  return toCandidate(Object.values(j.query?.pages ?? {})[0] ?? {});
}

function licenseOk(c) {
  if (!c.license || BLOCKED_LICENSES.test(c.license)) return false;
  if (c.restrictions && /personality|trademark/i.test(c.restrictions) === false && c.restrictions.length > 0) return false;
  return ALLOWED_LICENSES.some((re) => re.test(c.license));
}
function sizeOk(c) {
  return ['image/jpeg', 'image/png'].includes(c.mime) && c.width >= 600 && c.height >= 400 && Math.max(c.width, c.height) / Math.min(c.width, c.height) <= 2.2;
}
function score(c, queries) {
  const t = c.title.toLowerCase();
  let s = Math.min(c.width, 2000) / 1000;
  for (const q of queries) if (q.toLowerCase().split(/\s+/).every((w) => t.includes(w))) s += 3;
  if (c.mime === 'image/jpeg') s += 0.5;
  return s;
}

async function download(c, id) {
  const ext = c.mime === 'image/png' ? 'png' : 'jpg';
  let r;
  for (let i = 0; i < 6; i++) {
    r = await fetch(c.thumbUrl, { headers: { 'User-Agent': UA } });
    if (r.ok) break;
    if (![403, 429, 500, 502, 503].includes(r.status)) break;
    await sleep(12000 * (i + 1)); // upload.wikimedia.org throttles bursts
  }
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  for (const e of ['jpg', 'png']) fs.rmSync(path.join(imgDir, `${id}.${e}`), { force: true });
  const file = `${id}.${ext}`;
  fs.writeFileSync(path.join(imgDir, file), buf);
  await sleep(4000);
  return { file, bytes: buf.length };
}

const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const overrides = fs.existsSync(path.join(imgDir, 'overrides.json')) ? JSON.parse(fs.readFileSync(path.join(imgDir, 'overrides.json'), 'utf8')) : {};
const usage = new Map(); // fileTitle -> productIds
for (const [id, m] of Object.entries(manifest)) if (m.status === 'matched') usage.set(m.title, [...(usage.get(m.title) ?? []), id]);

const record = (p, c, extra) => ({
  productId: p.id, productName: p.name, category: p.category, status: 'matched',
  matchLevel: 'type', // photo shows this TYPE of product, not the exact fictional SKU/brand
  title: c.title, sourceUrl: c.sourceUrl, author: c.author, license: c.license, licenseUrl: c.licenseUrl,
  width: c.width, height: c.height, fetchedAt: new Date().toISOString(), approved: false, ...extra,
});

for (const p of products) {
  if (only && !only.has(p.id) && !only.has(p.id.split('-')[0])) continue;
  if (!refresh && manifest[p.id]?.status === 'matched') { console.log(`= ${p.id} (kept)`); continue; }
  const rule = ruleFor(p);
  try {
    let chosen = null, shared = false, reason = '';
    if (overrides[p.id]) {
      const c = await byTitle(overrides[p.id]);
      if (c && licenseOk(c) && sizeOk(c)) chosen = c; else reason = `override ${overrides[p.id]} failed licence/size checks`;
    } else if (!rule) {
      reason = 'no image rule for this product';
    } else {
      const seen = new Map();
      for (const q of rule.queries) for (const c of await search(q)) seen.set(c.title, c);
      const pool = [...seen.values()].filter((c) => licenseOk(c) && sizeOk(c) && rule.require.test(c.title) && !rule.exclude.test(c.title) && !GLOBAL_EXCLUDE.test(c.title));
      pool.sort((a, b) => score(b, rule.queries) - score(a, rule.queries));
      chosen = pool.find((c) => !usage.has(c.title)) ?? null;
      if (!chosen && rule.allowShared) {
        chosen = pool.find((c) => (usage.get(c.title)?.length ?? 0) < rule.allowShared) ?? null;
        shared = !!chosen;
      }
      if (!chosen) reason = pool.length ? 'all acceptable images already used by other products' : 'no Commons image passed licence/size/title filters';
    }
    if (!chosen) {
      for (const e of ['jpg', 'png']) fs.rmSync(path.join(imgDir, `${p.id}.${e}`), { force: true });
      manifest[p.id] = { productId: p.id, productName: p.name, category: p.category, status: 'needs_review', reason, rule: rule?.name ?? null, checkedAt: new Date().toISOString() };
      console.log(`? ${p.id} NEEDS REVIEW — ${reason}`);
    } else {
      const { file, bytes } = await download(chosen, p.id);
      manifest[p.id] = record(p, chosen, { file, bytes, rule: rule?.name, sharedImage: shared });
      usage.set(chosen.title, [...(usage.get(chosen.title) ?? []), p.id]);
      console.log(`+ ${p.id} ← ${chosen.title} (${chosen.license})${shared ? ' [shared]' : ''}`);
    }
  } catch (e) {
    console.log(`! ${p.id} error: ${e.message}`);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

const all = Object.values(manifest);
console.log(`\nmatched ${all.filter((m) => m.status === 'matched').length} · needs_review ${all.filter((m) => m.status === 'needs_review').length} · total ${products.length}`);
console.log('Next: open images/ and review each match, set "approved": true in manifest.json (or run validate-images.mjs --approve-all after checking).');
