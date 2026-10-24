# Firebase setup

## 1. Create the project
1. console.firebase.google.com → **Add project** (Spark/free plan is enough; nothing here needs Cloud Functions or Blaze).
2. **Authentication → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create database** (production mode, region near you, e.g. `asia-south1`).
4. **Project settings → General → Your apps:**
   - Add a **Web app** → copy the config into `mobile/.env` (`EXPO_PUBLIC_FIREBASE_*`) and `admin/.env` (`VITE_FIREBASE_*`).
   - Add an **Android app** with package `com.califnco.waterpurifier` → download `google-services.json` into `mobile/` (git-ignored). Needed for push notifications in a real build.
5. **Project settings → Service accounts → Generate new private key.** Keep the JSON **private** — it goes only into Vercel env (`FIREBASE_SERVICE_ACCOUNT_JSON`, as a single line), the seed command, and n8n. Never commit it.

## 2. Deploy rules and indexes
```bash
npm i -g firebase-tools
firebase login
cd firebase
firebase use --add            # pick your project
firebase deploy --only firestore:rules,firestore:indexes
```

## 3. Seed the catalogue (59 products + wholesale prices)
```bash
cd firebase/seed
npm install
# Windows PowerShell:  $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content ..\..\sa.json -Raw
export FIREBASE_SERVICE_ACCOUNT_JSON="$(cat /path/to/serviceAccount.json)"
npm run seed
```
Product images: see `docs/images.md` (the seed writes retail data to `products/*` and wholesale prices to `dealerPricing/*`).

## 4. Create the first admin
Admin accounts cannot be self-created (rules forbid `role: admin` from clients).
1. Register normally (in the mobile app, or Authentication → Add user in the console).
2. Firestore → `users/<that uid>` → create/edit the document and set `role` to `admin` (add `name`, `email`, `createdAt` if you created the user in the console).
3. Sign in at the admin website.

## Data model
| Collection | Written by | Notes |
|---|---|---|
| `users/{uid}` | owner (role `customer`/`dealer` only) | role immutable by client |
| `dealers/{uid}` | owner creates as `pending`; **admin** changes status | |
| `products/{id}` | admin | public read, **retail price only** |
| `dealerPricing/{id}` | admin | readable only by approved dealers + admins |
| `orders/{id}` | **server only** (after payment verification); admin updates status | owner/admin read |
| `pendingOrders/{rzpOrderId}` | server only | no client access (default deny) |
| `carts/{uid}` | owner | |
| `addresses/{id}` | owner | |
| `serviceBookings/{id}` | owner creates (`requested`); admin updates | |
| `notifications/{id}` | server/admin create; owner can only flip `read` | |
| `automationLogs/{date}` | n8n via service account | admin read |
