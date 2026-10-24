# Architecture

```
┌────────────────────┐        ┌───────────────────────────────┐
│ mobile (Expo RN)   │        │ admin (Vite React) on Vercel  │
│ customer + dealer  │        │  /           dashboard SPA    │
└──────┬───────┬─────┘        │  /api/*      serverless (Node)│
       │       │              └───────┬──────────────┬────────┘
       │ Firestore SDK (rules)         │ Firestore SDK│ Admin SDK (bypasses rules)
       │       │ HTTPS + ID token      │ (rules)      │
       ▼       └───────────────────────┘              ▼
  ┌──────────────────────── Firebase ─────────────────────────┐
  │ Auth · Firestore (+ security rules) · Cloud Messaging     │
  └───────────────────────────────────────────────────────────┘
        ▲                    Razorpay (orders API + checkout.js)
        │ service account    Cloudinary · OSM/Nominatim · EmailJS · TextBee
   n8n daily workflow ──► Gemini ─► image ─► Cloudinary ─► Instagram Graph API
```

## Trust boundaries
- **Clients are untrusted.** They can read the public catalogue, their own data, and write only what rules allow (profile, addresses, cart, service request, pending dealer application).
- **Privileged operations run in `admin/api` with the Firebase Admin SDK**, after verifying the caller's ID token and loading their role from Firestore:
  | Endpoint | Caller | Does |
  |---|---|---|
  | `POST /api/create-order` | customer / approved dealer | Re-prices the cart **from Firestore** (retail or dealer price, stock, min qty), creates the Razorpay order, parks the priced cart in `pendingOrders` |
  | `POST /api/verify-payment` | same user | Verifies the Razorpay HMAC signature (timing-safe), re-fetches the payment from Razorpay and checks order id, amount and status, then in one transaction decrements stock and writes `orders/{id}` with `paymentStatus: paid`. Idempotent. Sends push / email / SMS |
  | `POST /api/admin-action` | admin | Order status, dealer approve/reject, service status — each notifies the user |
- **Wholesale pricing is enforced server-side twice**: `dealerPricing` is unreadable to non-approved users by rules, and `create-order` only applies it when `dealers/{uid}.status == "approved"`. A tampered client cannot buy at dealer price or mark an order paid.
- **Razorpay secret, service account, EmailJS private key, TextBee key** exist only as Vercel env vars. The client only receives the public `rzp_test_` key id from `create-order`.

## Payment flow
Cart → address → `create-order` (server price) → Razorpay Checkout in a WebView → client posts `{order_id, payment_id, signature}` to `verify-payment` → server verifies → Firestore order → confirmation screen. The WebView callback is treated as a *claim*; nothing is marked paid until the server confirms with Razorpay.

Why a WebView and not `react-native-razorpay`: the official SDK is a native module that does not run in Expo Go and needs a custom dev client; Checkout.js in a WebView works in Expo Go and in the release APK with no native build config. Trade-off: UPI-app intents may not launch from inside a WebView — cards, netbanking and wallets work (use Razorpay's test cards).

## Mobile structure
`app/` expo-router screens · `components/` reusable UI (`ui.tsx`, `ProductCard`, `ProductGrid`, `AddressForm`, `Header`) · `store/` Zustand (`authStore`, `cartStore` persisted, `catalogStore`, pure `cartLogic`/`catalogFilter` unit-tested) · `services/` Firebase/API/geo/push · `hooks/` · `constants/`.

Role handling: `authStore` loads `users/{uid}` and `dealers/{uid}`. A root-layout guard sends signed-out users to login and **unapproved dealers to `/dealer-status`** (they cannot reach the catalogue/cart). Approved dealers get wholesale prices, a dashboard card, and per-product minimum quantities.

## Admin structure
`src/pages` (Overview, Products, Orders, Customers, Dealers + Approval Requests, Service Desk), `layouts/DashboardLayout` (sidebar + navbar), `components/ui` (KPI card, status badge, confirm dialog, tables), `contexts/AuthContext` (admin-only login — non-admins are signed straight back out), `hooks/useCollection` (live Firestore).

## Known simplifications
- Shared types are copied into `mobile/types` and `admin/src/types` (Vercel's root is `admin/`, so it cannot import `../shared`). Edit `shared/` then copy.
- Overview aggregates (revenue, counts) are computed in the browser from live collections — fine for demo volumes, would move to server-side aggregates at scale.
- Cart is persisted locally and mirrored to `carts/{uid}`; it is not restored from Firestore on a new device.
- No refunds / returns flow.
