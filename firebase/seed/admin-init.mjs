// Shared Firebase Admin initialisation for the seed / upload scripts.
import fs from 'node:fs';

export async function initAdmin() {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  let json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!json && file) {
    if (!fs.existsSync(file)) {
      console.error(`GOOGLE_APPLICATION_CREDENTIALS points to a file that does not exist:\n  ${file}`);
      process.exit(1);
    }
    json = fs.readFileSync(file, 'utf8');
  }
  if (!json) {
    console.error(
      'No Firebase credentials found.\n' +
        'Download a service-account key (Firebase console → Project settings → Service accounts → Generate new private key),\n' +
        'then set GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/key.json in firebase/seed/.env',
    );
    process.exit(1);
  }
  const account = JSON.parse(json);
  initializeApp({ credential: cert(account), projectId: account.project_id });
  console.log(`Using Firebase project: ${account.project_id}`);
  return getFirestore();
}
