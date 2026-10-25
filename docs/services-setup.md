# Service setup — exact steps

Do these in order. Each ends with where the values go. **Never commit real values**; every `.env` is git-ignored and each folder has a `.env.example` listing every variable.

| Variable | Needed by | Where it comes from |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_*` (6) | mobile | §1.4 Web app config |
| `EXPO_PUBLIC_API_URL` | mobile | §5 Vercel URL |
| `VITE_FIREBASE_*` (6) | admin (browser) | §1.4 (same values) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel API, seed, n8n | §1.5 |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Vercel API | §2 |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` | image upload script, n8n | §3 |
| `EMAILJS_*`, `TEXTBEE_*` | Vercel API (optional) | §4 |

## 1. Firebase
1. https://console.firebase.google.com → **Add project** → name it (e.g. `califnco`) → Google Analytics optional → Create.
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database** → *Production mode* → location (e.g. `asia-south1` Mumbai) → Enable.
4. **Project settings (gear) → General → Your apps:**
   - Click **`</>` Web** → nickname `califnco-web` → Register. Copy the `firebaseConfig` values into `mobile/.env` (as `EXPO_PUBLIC_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID`) **and** `admin/.env` (as `VITE_FIREBASE_…`).
   - Click **Add app → Android** → package name `com.califnco.waterpurifier` → Register → **download `google-services.json`** → put it in `mobile/` (git-ignored). Required for push notifications in the APK.
5. **Project settings → Service accounts → Generate new private key → Generate.** Save the JSON outside the repo. Make it one line for env vars:
   - PowerShell: `(Get-Content C:\secrets\sa.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress)`
   - bash: `jq -c . /path/sa.json`
6. Deploy rules/indexes and run the rules tests:
   ```bash
   cd firebase
   npm i
   npx firebase login
   npx firebase deploy --only firestore:rules,firestore:indexes --project <your-project-id>
   npm run test:rules          # 23 tests against the local emulator (needs Java)
   ```
7. Seed products (see §3 for images):
   ```bash
   cd firebase/seed && npm i
   # PowerShell
   $env:FIREBASE_SERVICE_ACCOUNT_JSON = '<paste the one-line JSON>'
   npm run seed
   ```
8. **Create the first admin:** register an account in the app (or Authentication → *Add user*). Firestore → `users` → that user's uid document → set field `role` = `admin` (create the doc with `name`, `email`, `createdAt` if you added the user in the console). Sign in at the admin site.
9. **Cloud Messaging (push):** nothing to enable separately — FCM is on by default; the server sends with the service account. Build the APK with `google-services.json` present (docs/deployment.md).

## 2. Razorpay (test mode)
1. https://razorpay.com → sign up → stay in **Test Mode** (toggle top-right of the dashboard). No KYC needed for test mode.
2. **Account & Settings → API Keys → Generate Test Key.** Copy **Key Id** (`rzp_test_…`) and **Key Secret** (shown once).
3. Put them **only** in Vercel env vars (§5): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. The secret never goes into the mobile app or any `VITE_`/`EXPO_PUBLIC_` variable.
4. Test payment: card `4111 1111 1111 1111`, any future expiry, any 3-digit CVV, then choose **Success** on the test bank page. Failure card/UPI test values: Razorpay docs → *Payments → Test card details*.
5. Optional: Settings → Webhooks isn't needed (verification is done synchronously by `/api/verify-payment`).

## 3. Cloudinary + product images
1. https://cloudinary.com → sign up (free).
2. **Dashboard** → copy **Cloud name** → `CLOUDINARY_CLOUD_NAME`.
3. **Settings (gear) → Upload → Upload presets → Add upload preset** → *Signing mode:* **Unsigned** → *Folder:* (leave blank; the script sets `califnco/products/<id>`) → Save → copy the preset name → `CLOUDINARY_UPLOAD_PRESET`. No API secret is used anywhere.
4. Image pipeline (already run once; outputs are committed in `firebase/seed/images/`):
   ```bash
   cd firebase/seed
   npm run images:fetch                  # Wikimedia Commons search → images/ + manifest.json (+ attribution)
   npm run images:validate               # writes images/REVIEW.md
   #   open images/ and LOOK at each file; then approve the good ones:
   node validate-images.mjs --approve P001,P002,…      # or --reject P0xx
   # PowerShell: set CLOUDINARY_* and FIREBASE_SERVICE_ACCOUNT_JSON, then:
   npm run images:upload:dry             # preview
   npm run images:upload                 # Cloudinary upload + Firestore image/imageCredit
   ```
   Products flagged `needs_review` get **no image** (never an unrelated one). Resolve by adding `"<productId>": "File:Exact name.jpg"` to `images/overrides.json`, then `node fetch-images.mjs --only <productId>`.

## 4. Optional notifications
- **EmailJS** (order confirmation email): emailjs.com → Email Services → Add (Gmail) → note *Service ID*; Email Templates → Create with variables `{{to_email}}`, `{{to_name}}`, `{{order_id}}`, `{{total}}` → *Template ID*; Account → *Public Key*; **Account → Security → enable "Allow API calls from non-browser" / create Private Key** → `EMAILJS_PRIVATE_KEY`. Set the four `EMAILJS_*` vars in Vercel. (Free tier is limited to ~200 emails/month.)
- **TextBee** (SMS through your own Android phone): textbee.dev → sign up → install the TextBee app on a spare phone → register device → copy **API key** and **Device ID** → `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`. The phone needs SIM + data. Indian DLT rules may block promotional SMS; transactional order SMS usually works but is not guaranteed.

## 5. Vercel (admin site + API)
1. Push the repo to GitHub. vercel.com → **Add New → Project** → import → **Root Directory = `admin`**.
2. **Environment Variables** — add every variable from `admin/.env.example` (client `VITE_FIREBASE_*` and server `FIREBASE_SERVICE_ACCOUNT_JSON`, `RAZORPAY_*`, optional `EMAILJS_*`, `TEXTBEE_*`, `ALLOWED_ORIGIN`).
3. Deploy → copy the URL → `mobile/.env` → `EXPO_PUBLIC_API_URL=https://<project>.vercel.app`.
4. Firebase console → Authentication → Settings → **Authorized domains** → add the Vercel domain.

## 6. Run everything
```bash
cd admin  && cp .env.example .env && npm i && npm run dev      # or: npx vercel dev  (UI + /api)
cd mobile && cp .env.example .env && npm i && npx expo start   # Expo Go; push needs the APK build
```
APK: `docs/deployment.md`. Verification checklist: `docs/testing.md`.
