# Instagram daily-post automation (n8n)

`instagram-daily-post.json` is an importable n8n workflow that posts one product per day.

> **Verification status:** the workflow's Code nodes (product selection, duplicate prevention, Gemini parsing) are unit-tested (`node automation/test-workflow.mjs automation/instagram-daily-post.json`). The full chain **has not been executed end-to-end against live Gemini / Cloudinary / Instagram APIs** — that needs your accounts and tokens. Follow "First run" below and treat the first execution as the real verification.

## Flow

| # | Node | What it does |
|---|------|--------------|
| 1 | Daily Trigger | 10:00 Asia/Kolkata every day |
| 2 | Config | Non-secret settings you edit once |
| 3–4 | Fetch Products / Logs | Firestore REST (service account) |
| 5 | Pick Product | Skips if today already `started`/`success`; prefers never-posted products, else the least recently posted; skips inactive / out-of-stock |
| 6 | Log Started | Writes `automationLogs/<YYYY-MM-DD>` (idempotency lock) |
| 7–9 | Build Prompt → Gemini → Parse | Caption + 10–15 hashtags + image prompt, built **only from the product's stored fields** |
| 10 | Generate Image | Pollinations.ai (free, no key) |
| 11 | Upload to Cloudinary | Unsigned upload preset |
| 12 | Instagram Image URL | Forces JPEG 1080×1080 via Cloudinary transformation |
| 13–15 | Create container → Wait 20 s → Publish | Meta Graph API |
| 16 | Log Success | Status, media id, caption, image URL |
| — | Error Trigger → Log Failure | Marks the day `failed` (a failed day can be re-run) |

HTTP nodes retry 3–5× with back-off.

## What you need (all have free tiers)

1. **n8n** — self-host (`docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n`) or n8n Cloud. It must stay running for the schedule to fire.
2. **Firebase service account** with Firestore access (same project as the app). In n8n create a *Google Service Account API* credential, paste the JSON, enable **"Set up for use in HTTP Request node"**, scope `https://www.googleapis.com/auth/datastore`.
3. **Gemini API key** from Google AI Studio. Create an n8n *Header Auth* credential: name `x-goog-api-key`, value = key. Free-tier quotas and model names change — if `gemini-2.5-flash` is unavailable, edit `GEMINI_MODEL` in the Config node.
4. **Cloudinary** — free account; Settings → Upload → add an **unsigned** upload preset. No API secret is needed or stored.
5. **Meta / Instagram** (the strictest part):
   - An Instagram **Business or Creator** account linked to a **Facebook Page**.
   - A Meta developer app with the **Instagram Graph API** (Instagram API with Facebook Login) product.
   - Permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`. In *Development mode* these work for accounts that have a role on the app (no App Review needed for your own account). Publishing for other people's accounts requires App Review.
   - A **long-lived token**: get a short-lived user token from Graph API Explorer → exchange via `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=…&client_secret=…&fb_exchange_token=…` (≈60 days) → request the **Page access token** from `/me/accounts` (a Page token derived from a long-lived user token does not expire). Create an n8n *Query Auth* credential: name `access_token`, value = that token.
   - `IG_USER_ID`: `GET /{page-id}?fields=instagram_business_account`.
   - **Image requirements:** the `image_url` must be a **publicly reachable JPEG** (Instagram rejects PNG/WebP); aspect ratio between 4:5 and 1.91:1. The workflow forces `f_jpg,w_1080,h_1080` through Cloudinary. Limits: 25 API-published posts / 24 h, caption ≤ 2,200 chars, ≤ 30 hashtags.
   - Check the current Graph API version at developers.facebook.com and update `GRAPH_VERSION` if `v23.0` has been retired.

## Setup

1. n8n → *Workflows → Import from file* → `instagram-daily-post.json`.
2. Open **Config** and fill: `FIREBASE_PROJECT_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `IG_USER_ID`.
3. Open **Log Failure** and replace `REPLACE_WITH_FIREBASE_PROJECT_ID` in the URL (the error branch can't read Config).
4. Attach credentials to: Fetch Products, Fetch Logs, Log Started, Log Success, Log Failure (Google service account); Gemini Caption (header auth); Create IG Container, Publish to Instagram (query auth).
5. *Workflow settings → Error workflow* → select **this same workflow** (so the Error Trigger fires).
6. Seed products first (`firebase/seed`), then **Execute workflow** manually once.
7. Toggle **Active**.

## First run checklist

- [ ] Fetch Products returns documents.
- [ ] Gemini Caption returns JSON text; Parse Content output looks right.
- [ ] Generate Image has a binary `data` image (if Pollinations is down/rate-limited, retry or swap the node for any image API that returns a file).
- [ ] Cloudinary returns `secure_url`; open the transformed URL in a browser — it must show a JPEG.
- [ ] Create IG Container returns `{ "id": "…" }`.
- [ ] Publish returns `{ "id": "…" }` and the post appears on Instagram.
- [ ] `automationLogs/<today>` has `status: success`.

## Known limits / honesty notes

- The generated image is an **AI illustration of this kind of product**, not a photo of the exact SKU. The **caption's facts (name, price, specs)** come from your database, but the picture may not match the real model. If exact visuals matter, replace *Generate Image* with a step that downloads the product's real `image` field.
- **Image provider risk (observed):** when I tested the keyless Pollinations endpoint on 2026-10-24 it returned `503 "The Classic API is at its limit right now"` and pointed to a keyed tier (enter.pollinations.ai). The node may therefore need a Pollinations key, or replacing with another image API (e.g. Gemini image generation, Hugging Face Inference, Stability) — any node that outputs a binary `data` image can drop in before *Upload to Cloudinary*.
- Gemini free tier is rate-limited. Retries are built in, but a day can still fail — the failure is logged and the next manual/scheduled run can retry that day.
- If the product catalogue is small, the same product will eventually repeat (least-recently-posted first); it never reposts one while unposted products remain.
- WhatsApp Status (WAHA) bonus is **not implemented**.
