# Testing

## Automated (run these)
| Command | Covers | Last result |
|---|---|---|
| `cd mobile && npm test` | cart logic, customer vs dealer pricing, min-qty, shipping threshold, validation rules, search/filter/sort | 12 passed |
| `cd mobile && npx tsc --noEmit` | mobile type check | clean |
| `cd mobile && npx expo export --platform android` | Metro bundles the whole app | succeeds |
| `cd admin && npm run build` | admin type check + production build | succeeds |
| `cd admin && npx tsc -p tsconfig.api.json` | serverless API type check | clean |
| `node automation/test-workflow.mjs automation/instagram-daily-post.json` | n8n Code nodes: Firestore unwrap, duplicate prevention, same-day lock, retry-after-failure, Gemini parsing | passed |

**Not automated / not yet run:** Firestore rules (needs the emulator + Java), the serverless API against real Firebase/Razorpay, UI flows on a device, the live n8n → Instagram chain. These require your Firebase/Razorpay/Meta accounts, so the journeys below are the manual verification you should run once configured.

## Manual journeys

### Customer
1. Register (Registration screen) → lands on Home with your name.
2. Sign out → Login → Home.
3. Browse a category, search "membrane", open Filters (brand, max price, sort).
4. Open a product → Add to cart → change quantity in Cart.
5. Checkout → add an address (try *Use my current location*) → Pay → Razorpay test card.
6. Expect: "Verifying…" → Order confirmed → Orders tab shows status `placed`, stock reduced in Firestore, a `notifications` doc exists.
7. Negative checks: close the payment sheet (returns to checkout, no order); in Firestore Rules Playground confirm a client `create` on `orders` is denied.

### Dealer
1. Login screen → *Apply as dealer* → submit. App shows **Awaiting approval**; try opening the catalogue — you stay on the status screen.
2. Admin site → *Approval Requests* → **Approve** (confirm).
3. Dealer taps *Check status* (or reopens) → catalogue shows **dealer prices** (e.g. ₹15,000 → ₹11,000) and the dashboard card.
4. Add a product with qty below its minimum → checkout button disabled; raise to the minimum → pay → order type `wholesale`.
5. Orders tab shows the wholesale order.
6. Negative: as a *pending* dealer, reading `dealerPricing` or calling `create-order` must fail (403).

### Admin
1. Sign in at the admin URL (a customer account is rejected).
2. Overview shows KPIs / revenue chart / recent orders.
3. Dealers / Approval Requests → approve & reject with confirmation.
4. Orders → change a status → customer receives an in-app (and push, if configured) notification.
5. Service Desk → update a booking created from the app.
6. Products → edit stock and prices.

### AI automation
Follow the first-run checklist in `automation/setup-guide.md`.
