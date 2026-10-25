// Usage: node seed.mjs            seed Firestore (needs FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS)
//        node seed.mjs --dry-run  print a summary only
// Safe to re-run: uses merge, and never writes `image`/`imageCredit` (those are owned by upload-images.mjs),
// so re-seeding will not wipe uploaded photos.
import { products } from './catalog.mjs';

const dry = process.argv.includes('--dry-run');
console.log(`${products.length} products across ${new Set(products.map((p) => p.category)).size} categories`);
if (dry) process.exit(0);

const { initAdmin } = await import('./admin-init.mjs');
const db = await initAdmin();

let batch = db.batch();
let n = 0;
for (const { dealerPrice, minQty, image, ...product } of products) {
  void image;
  const ref = db.doc(`products/${product.id}`);
  // `image` defaults to "" only for brand-new documents.
  const exists = (await ref.get()).exists;
  batch.set(ref, exists ? product : { ...product, image: '' }, { merge: true });
  batch.set(db.doc(`dealerPricing/${product.id}`), { productId: product.id, dealerPrice, minQty }, { merge: true });
  if ((n += 2) % 400 === 0) { await batch.commit(); batch = db.batch(); }
}
await batch.commit();
console.log('Seeded products + dealerPricing');
