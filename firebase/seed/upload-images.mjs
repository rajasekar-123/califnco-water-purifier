// Uploads APPROVED + VALID images to Cloudinary and writes the URL and attribution to Firestore.
//   node upload-images.mjs --dry-run    show what would happen (no network, no credentials needed)
//   node upload-images.mjs              upload + update Firestore
//   node upload-images.mjs --force      re-upload even if already uploaded
// Needs (see .env.example): CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET (unsigned),
//                           FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS
import fs from 'node:fs';
import path from 'node:path';
import { imgDir, loadManifest, problems, saveManifest } from './validate-images.mjs';

const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run');
const force = args.has('--force');

const manifest = loadManifest();
const todo = Object.values(manifest).filter((m) => m.status === 'matched' && m.approved && !problems(m).length && (force || !m.cloudinaryUrl));
const skipped = Object.values(manifest).filter((m) => m.status === 'matched' && !m.approved).length;
console.log(`${todo.length} to upload · ${skipped} matched but not approved (skipped) · ${Object.values(manifest).filter((m) => m.status !== 'matched').length} flagged`);
if (dry) {
  todo.forEach((m) => console.log(`  would upload ${m.file} → products/${m.productId}  [${m.license}]`));
  process.exit(0);
}
if (!todo.length) process.exit(0);

const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_UPLOAD_PRESET: preset } = process.env;
if (!cloud || !preset) {
  console.error('Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_UPLOAD_PRESET. Copy .env.example and export the values.');
  process.exit(1);
}
const { initAdmin } = await import('./admin-init.mjs');
const db = await initAdmin();

async function upload(m) {
  const form = new FormData();
  const buf = fs.readFileSync(path.join(imgDir, m.file));
  form.append('file', new Blob([buf]), m.file);
  form.append('upload_preset', preset);
  form.append('public_id', `califnco/products/${m.productId}`);
  form.append('tags', 'califnco,product,wikimedia-commons');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${body.error?.message ?? 'upload failed'}`);
  return body.secure_url;
}

let ok = 0, failed = 0;
for (const m of todo) {
  try {
    const raw = await upload(m);
    // Serve a web-sized, auto-format version.
    const url = raw.replace('/upload/', '/upload/f_auto,q_auto,w_900,c_limit/');
    const ref = db.doc(`products/${m.productId}`);
    if (!(await ref.get()).exists) throw new Error('product document does not exist — run the seed first');
    await ref.update({
      image: url,
      imageCredit: {
        author: m.author, license: m.license, licenseUrl: m.licenseUrl, sourceUrl: m.sourceUrl,
        title: m.title, matchLevel: m.matchLevel, // "type": illustrative photo of this kind of product
      },
    });
    manifest[m.productId].cloudinaryUrl = url;
    manifest[m.productId].uploadedAt = new Date().toISOString();
    saveManifest(manifest);
    ok++;
    console.log(`✓ ${m.productId}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${m.productId}: ${e.message}`);
  }
}
console.log(`done: ${ok} uploaded, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
