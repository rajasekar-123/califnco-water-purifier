import { auth } from '../firebase';

/** Calls the privileged serverless API with the admin's Firebase ID token. */
export async function adminAction(body: Record<string, unknown>) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/admin-action', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}
