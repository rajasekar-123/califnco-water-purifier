// Promote an EXISTING Firebase Auth user to admin.   node make-admin.mjs you@example.com [--revoke]
// Touches only users/{uid} (merge: role, plus name/email/createdAt if the doc is missing).
// Never reads or writes products or dealerPricing.
import { initAdmin } from './admin-init.mjs';

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');
if (!email || email.startsWith('--')) {
  console.error('Usage: node --env-file-if-exists=.env make-admin.mjs <email> [--revoke]');
  process.exit(1);
}

const db = await initAdmin();
const { getAuth } = await import('firebase-admin/auth');

let user;
try {
  user = await getAuth().getUserByEmail(email);
} catch (e) {
  if (e.code === 'auth/user-not-found') {
    console.error(`No Firebase Auth user with email ${email}. Register that account in the app first, then re-run.`);
  } else console.error(e.message);
  process.exit(1);
}

const ref = db.doc(`users/${user.uid}`);
const snap = await ref.get();
const role = revoke ? 'customer' : 'admin';
const patch = { role };
if (!snap.exists) Object.assign(patch, { name: user.displayName || email.split('@')[0], email: user.email, createdAt: Date.now() });
await ref.set(patch, { merge: true });

console.log(`${revoke ? 'Revoked' : 'Granted'}: users/${user.uid} (${user.email}) role -> ${role}`);
console.log('Re-read from Firestore:', (await ref.get()).data()?.role);
