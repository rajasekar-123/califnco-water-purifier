# Deployment

## Admin dashboard + API → Vercel
1. Push the repo to GitHub.
2. vercel.com → **Add New Project** → import the repo → **Root Directory: `admin`** (framework auto-detects Vite; `vercel.json` adds the SPA rewrite and leaves `/api/*` alone).
3. **Environment variables** (Project → Settings → Environment Variables), values from `admin/.env.example`:
   - Client: `VITE_FIREBASE_*`
   - Server: `FIREBASE_SERVICE_ACCOUNT_JSON` (whole JSON, one line), `RAZORPAY_KEY_ID` (`rzp_test_…`), `RAZORPAY_KEY_SECRET`, optional `EMAILJS_*`, `TEXTBEE_*`, `ALLOWED_ORIGIN`.
4. Deploy. Note the URL, e.g. `https://califnco-admin.vercel.app` → this is the mobile app's `EXPO_PUBLIC_API_URL`.
5. Firebase console → Authentication → Settings → **Authorized domains** → add the Vercel domain.

Local dev: `cd admin && npm i && npm run dev` (UI only), or `npx vercel dev` to also serve `/api`.

## Razorpay test keys
Dashboard (Test Mode) → Account & Settings → API Keys → Generate. Test cards: `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234` / success on the mock bank page. No real money moves in test mode.

## Android APK (EAS Build)
```bash
cd mobile
cp .env.example .env            # fill Firebase + EXPO_PUBLIC_API_URL
# place google-services.json in mobile/ (needed for FCM push)
npm i -g eas-cli
eas login
eas build:configure             # first time; links an Expo project
eas build --platform android --profile preview     # → installable .apk
```
`EXPO_PUBLIC_*` values must also be set for EAS: `eas env:create` (or put them in the EAS dashboard) — a local `.env` is not uploaded when the file is git-ignored.

Local alternative (needs Android SDK + JDK 17): `npx expo prebuild --platform android && cd android && ./gradlew assembleRelease`.

Run without building (no push, no FCM): `cd mobile && npx expo start` and open in **Expo Go** (login, catalogue, cart, checkout/payment WebView, service booking all work; push registration is skipped).

## n8n
See `automation/setup-guide.md`.
