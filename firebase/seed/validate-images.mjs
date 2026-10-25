// Validates images/manifest.json and the files on disk. Writes images/REVIEW.md.
//   node validate-images.mjs                       report only
//   node validate-images.mjs --approve P001,P002   mark specific products approved (after YOU viewed them)
//   node validate-images.mjs --approve-all-valid   approve every valid match (only after reviewing all images)
//   node validate-images.mjs --reject P007         drop a match; product goes back to needs_review
// Exit code 1 if any matched entry is invalid.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from './catalog.mjs';
import { ALLOWED_LICENSES, BLOCKED_LICENSES } from './image-rules.mjs';

export const dir = path.dirname(fileURLToPath(import.meta.url));
export const imgDir = path.join(dir, 'images');
export const manifestPath = path.join(imgDir, 'manifest.json');

export const loadManifest = () => (fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {});
export const saveManifest = (m) => fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));

/** Returns a list of problems for one manifest entry (empty = valid). */
export function problems(m) {
  const errs = [];
  if (m.status !== 'matched') return ['not matched'];
  const file = path.join(imgDir, m.file ?? '');
  if (!m.file || !fs.existsSync(file)) return ['image file missing'];
  const buf = fs.readFileSync(file);
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng = buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (!isJpg && !isPng) errs.push('not a real JPEG/PNG');
  if (buf.length < 10_000) errs.push('file under 10 KB');
  if (buf.length > 9_000_000) errs.push('file over 9 MB');
  if (!(m.width >= 600)) errs.push('source width under 600px');
  if (!m.license || BLOCKED_LICENSES.test(m.license) || !ALLOWED_LICENSES.some((re) => re.test(m.license))) errs.push(`licence not allowed: "${m.license}"`);
  if (!m.author || m.author === 'Unknown') errs.push('author/attribution missing');
  if (!/^https:\/\/commons\.wikimedia\.org\//.test(m.sourceUrl ?? '')) errs.push('source URL missing');
  return errs;
}

function main() {
  const args = process.argv.slice(2);
  const manifest = loadManifest();
  const ids = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1].split(',') : []);

  for (const key of ids('--approve')) {
    const id = Object.keys(manifest).find((k) => k === key || k.startsWith(key + '-'));
    if (id && manifest[id].status === 'matched' && !problems(manifest[id]).length) manifest[id].approved = true;
    else console.log(`cannot approve ${key}`);
  }
  if (args.includes('--approve-all-valid')) for (const m of Object.values(manifest)) if (!problems(m).length) m.approved = true;
  for (const key of ids('--reject')) {
    const id = Object.keys(manifest).find((k) => k === key || k.startsWith(key + '-'));
    if (id) manifest[id] = { productId: id, productName: manifest[id].productName, category: manifest[id].category, status: 'needs_review', reason: 'rejected in manual review' };
  }
  saveManifest(manifest);

  const lines = ['# Image review', '', `Generated ${new Date().toISOString()}`, ''];
  let invalid = 0, approved = 0, pending = 0, flagged = 0;
  const rows = [];
  for (const p of products) {
    const m = manifest[p.id];
    if (!m) { flagged++; rows.push([p.id, p.name, 'NOT FETCHED', 'run fetch-images.mjs']); continue; }
    if (m.status !== 'matched') { flagged++; rows.push([p.id, p.name, 'NEEDS REVIEW', m.reason ?? '']); continue; }
    const errs = problems(m);
    if (errs.length) { invalid++; rows.push([p.id, p.name, 'INVALID', errs.join('; ')]); continue; }
    if (m.approved) { approved++; rows.push([p.id, p.name, 'approved', `${m.title} — ${m.license}${m.sharedImage ? ' (shared)' : ''}`]); }
    else { pending++; rows.push([p.id, p.name, 'awaiting approval', `${m.title} — ${m.license}`]); }
  }
  lines.push(`approved **${approved}** · awaiting approval **${pending}** · needs manual review **${flagged}** · invalid **${invalid}**`, '');
  lines.push('| Product | Name | Status | Detail |', '|---|---|---|---|');
  for (const r of rows) lines.push(`| ${r[0].split('-')[0]} | ${r[1]} | ${r[2]} | ${r[3].replace(/\|/g, '/')} |`);
  lines.push('', 'To resolve a flagged product: find a suitable file on commons.wikimedia.org, add `"<productId>": "File:Name.jpg"` to `images/overrides.json`, then `node fetch-images.mjs --only <productId>`.');
  fs.writeFileSync(path.join(imgDir, 'REVIEW.md'), lines.join('\n'));
  console.log(lines[4]);
  console.log('Details: firebase/seed/images/REVIEW.md');
  if (invalid) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
