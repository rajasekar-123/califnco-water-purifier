// Usage: node seed.mjs            -> seed Firestore (needs GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON)
//        node seed.mjs --upload-images -> also upload ./images/<id>.jpg to Cloudinary (needs CLOUDINARY_* env)
//        node seed.mjs --dry-run      -> print summary only
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, CATEGORY_IMAGES } from './catalog.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));

async function uploadToCloudinary(file, publicId) {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_UPLOAD_PRESET: preset } = process.env;
  if (!cloud || !preset) throw new Error('Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET (unsigned preset)');
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(file)]), path.basename(file));
  form.append('upload_preset', preset);
  form.append('public_id', `califnco/products/${publicId}`);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${await res.text()}`);
  return (await res.json()).secure_url;
}

for (const p of products) {
  const local = ['jpg', 'jpeg', 'png', 'webp'].map((e) => path.join(dir, 'images', `${p.id}.${e}`)).find(fs.existsSync);
  if (local && args.has('--upload-images')) p.image = await uploadToCloudinary(local, p.id);
  else p.image = CATEGORY_IMAGES[p.category] ?? '';
}

console.log(`${products.length} products, ${products.filter((p) => p.image).length} with images`);
if (args.has('--dry-run')) process.exit(0);

const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
initializeApp({
  credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault(),
});
const db = getFirestore();
let batch = db.batch();
let n = 0;
for (const { dealerPrice, minQty, ...product } of products) {
  batch.set(db.doc(`products/${product.id}`), product);
  batch.set(db.doc(`dealerPricing/${product.id}`), { productId: product.id, dealerPrice, minQty });
  if ((n += 2) % 400 === 0) { await batch.commit(); batch = db.batch(); }
}
await batch.commit();
console.log('Seeded products + dealerPricing');
