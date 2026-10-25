// Proves the admin role is honoured by the LIVE Firestore security rules.
//   node verify-admin.mjs you@example.com
// Signs in as that user via a short-lived custom token (no password needed) and then, as that user:
//   - reads dealerPricing            (rules: admin or approved dealer only)
//   - lists ALL orders               (rules: admin only)
//   - reads the automationLogs rule  (admin only)
// and checks the same role field the Vercel API (requireAdmin) and the admin login read.
// It performs READ operations only.
import { initAdmin } from './admin-init.mjs';

const email = process.argv[2];
if (!email) { console.error('Usage: node verify-admin.mjs <email>'); process.exit(1); }

const db = await initAdmin();
const { getAuth } = await import('firebase-admin/auth');
const user = await getAuth().getUserByEmail(email);

const doc = (await db.doc(`users/${user.uid}`).get()).data();
console.log(`backend check (same read as api/_lib.ts requireAdmin): role = ${doc?.role}`);

const token = await getAuth().createCustomToken(user.uid);
const { initializeApp } = await import('firebase/app');
const { getAuth: clientAuth, signInWithCustomToken } = await import('firebase/auth');
const fs = await import('firebase/firestore');
const app = initializeApp({ apiKey: process.env.FIREBASE_WEB_API_KEY, projectId: process.env.GCLOUD_PROJECT || (await import('node:fs')).readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8').match(/"default":\s*"([^"]+)"/)[1] });
await signInWithCustomToken(clientAuth(app), token);
const cdb = fs.getFirestore(app);

let ok = true;
for (const [label, fn] of [
  ['read dealerPricing', async () => `${(await fs.getDocs(fs.collection(cdb, 'dealerPricing'))).size} docs`],
  ['list all orders', async () => `${(await fs.getDocs(fs.collection(cdb, 'orders'))).size} docs`],
  ['read automationLogs', async () => `${(await fs.getDocs(fs.collection(cdb, 'automationLogs'))).size} docs`],
]) {
  try { console.log(`ALLOWED  ${label}: ${await fn()}`); }
  catch (e) { ok = false; console.log(`DENIED   ${label}: ${e.code}`); }
}
console.log(doc?.role === 'admin' && ok ? '\nVERIFIED: admin role is recognised by backend and Firestore rules.' : '\nNOT VERIFIED — see lines above.');
process.exit(doc?.role === 'admin' && ok ? 0 : 1);
