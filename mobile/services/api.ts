import { auth } from './firebase';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Authenticated call to the trusted serverless API (payments, orders). */
export async function api<T>(path: string, body: unknown): Promise<T> {
  if (!BASE) throw new ApiError(0, 'EXPO_PUBLIC_API_URL is not configured');
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${BASE}/api/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error ?? `Request failed (${res.status})`);
  return json as T;
}
