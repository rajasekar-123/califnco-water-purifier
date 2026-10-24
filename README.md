# Califnco — Water Purifier Commerce Suite

Monorepo for the Califnco Round-1 assignment: a customer + dealer Android app, an admin web dashboard with a secure serverless API, and an n8n Instagram automation.

| Folder | What | Stack |
|---|---|---|
| `mobile/` | Customer **and** dealer Android app | Expo SDK 58, React Native, TypeScript, Expo Router, Reanimated, Zustand |
| `admin/` | Admin dashboard + `/api` (payments, privileged actions) | Vite, React, TypeScript, Tailwind v4, Recharts, Lucide, Vercel functions |
| `firebase/` | Security rules, indexes, 59-product seed | Firestore |
| `automation/` | Importable n8n workflow + guide | n8n, Gemini, Cloudinary, Instagram Graph API |
| `shared/` | Source of truth for types/constants (copied into mobile/admin) | |
| `docs/` | architecture, firebase-setup, deployment, testing | |

## Status — what is real vs. what still needs your accounts

| Area | State |
|---|---|
| Mobile: all 20 screens, auth, catalogue, search/filter/sort, cart, checkout, addresses (GPS + OpenStreetMap), Razorpay flow, orders, service booking, notifications, profile, dealer role, pinch-zoom | **Implemented.** Type-checks, bundles with Metro, core logic unit-tested (12 tests). **Not yet run on a device/emulator against a live Firebase** (no project credentials available while building). |
| Dealer approval gating + wholesale pricing | Implemented in rules **and** server; verify with the journeys in `docs/testing.md` |
| Admin: login (admin-only), overview/KPIs/revenue chart, products & inventory, orders, customers, dealers, approval queue, service desk, confirm dialogs | **Implemented.** `npm run build` passes. Not yet exercised against live Firestore. |
| Payments | Server-side signature + Razorpay-API verification, server-side pricing. Needs your Razorpay **test** keys. Never run against Razorpay here. |
| Push (FCM) | Token registration + server send implemented. Needs `google-services.json` + a dev/release build (not Expo Go). Untested. |
| Email (EmailJS) / SMS (TextBee) | Server hooks implemented; silently skipped until you set the env vars. Untested. |
| n8n Instagram workflow | Importable JSON; Code-node logic unit-tested. **Not executed against live Gemini/Cloudinary/Instagram.** Image-provider caveat in `automation/setup-guide.md`. |
| **Product images** | **Outstanding.** The 59-product catalogue has no photos yet (cards show a branded water-drop placeholder). See below. |
| Bonus: image zoom, referral code share | Done. Dark mode, WAHA WhatsApp Status — **not implemented.** |

## Quick start
```bash
# 1. Firebase: follow docs/firebase-setup.md (project, rules, seed, first admin)

# 2. Admin + API
cd admin && cp .env.example .env && npm i && npm run dev        # UI
npx vercel dev                                                  # UI + /api locally

# 3. Mobile
cd mobile && cp .env.example .env && npm i
npx expo start                                                  # Expo Go: everything except push
npm test && npx tsc --noEmit
```
Build the APK and deploy the admin: `docs/deployment.md`. Tests: `docs/testing.md`. Architecture and security model: `docs/architecture.md`.

## Credentials you must supply
Firebase (web config + service account) · Razorpay test key id/secret · Cloudinary cloud name + unsigned preset · (optional) EmailJS, TextBee · (automation) Gemini key, Meta app + Page token + IG Business account id, n8n instance. Nothing secret is committed; `.env`, service accounts and `google-services.json` are git-ignored.

## Product images
Seed writes `image: ""` unless a file named `<product-id>.jpg|png|webp` exists in `firebase/seed/images/`, in which case `npm run seed -- --upload-images` uploads it to Cloudinary (set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`) and stores the URL. Product ids are in `firebase/seed/catalog.mjs`.

# califnco-water-purifier