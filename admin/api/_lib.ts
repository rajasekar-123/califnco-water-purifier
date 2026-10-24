import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  initializeApp({ credential: cert(JSON.parse(raw)) });
}

export const db = getFirestore();
export const auth = getAuth();
export const messaging = getMessaging();

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface Caller {
  uid: string;
  role: 'customer' | 'dealer' | 'admin';
  name: string;
  email: string;
}

/** Verifies the Firebase ID token and loads the caller's role from Firestore (never from the client). */
export async function requireUser(req: VercelRequest): Promise<Caller> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Missing bearer token');
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  const snap = await db.doc(`users/${decoded.uid}`).get();
  if (!snap.exists) throw new HttpError(403, 'User profile not found');
  const u = snap.data()!;
  return { uid: decoded.uid, role: u.role, name: u.name ?? '', email: u.email ?? decoded.email ?? '' };
}

export async function requireAdmin(req: VercelRequest): Promise<Caller> {
  const caller = await requireUser(req);
  if (caller.role !== 'admin') throw new HttpError(403, 'Admin only');
  return caller;
}

/** Wraps a handler with method check, CORS and uniform error output. */
export function handler(
  method: 'POST' | 'GET',
  fn: (req: VercelRequest, res: VercelResponse) => Promise<unknown>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    res.setHeader('Access-Control-Allow-Methods', `${method}, OPTIONS`);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== method) return res.status(405).json({ error: 'Method not allowed' });
    try {
      const result = await fn(req, res);
      if (!res.writableEnded) res.status(200).json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
      console.error(e);
      res.status(500).json({ error: 'Internal error' });
    }
  };
}

/** Writes an in-app notification and sends a push if the user has an FCM token. Push failure never throws. */
export async function notifyUser(uid: string, title: string, body: string) {
  await db.collection('notifications').add({ uid, title, body, read: false, createdAt: Date.now() });
  const token = (await db.doc(`users/${uid}`).get()).data()?.fcmToken;
  if (!token) return;
  try {
    await messaging.send({ token, notification: { title, body }, android: { priority: 'high' } });
  } catch (e) {
    console.warn('FCM send failed', (e as Error).message);
  }
}
