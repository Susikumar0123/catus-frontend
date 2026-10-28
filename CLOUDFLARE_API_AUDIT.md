# Cerood Cloudflare migration — API contract audit (in progress)

This file records findings verified against `Susikumar0123/catus-frontend` and `Susikumar0123/catus-backend` on 2026-10-28. It is not a claim that the production migration is complete.

## Confirmed source contracts

| Frontend | Request | Backend module | Status |
|---|---|---|---|
| `seller-dashboard-test/seller-api.js` | `POST /api/sellers/upload-media` | `cerood-seller-media.js` | Route exists; live multipart round-trip not verified |
| `cerood-store-checkout.js` | `POST /api/shop/create-razorpay-order` | `cerood-shop-payments.js` | Route exists; payment not tested |
| `cerood-store-checkout.js` | `POST /api/shop/verify-razorpay-payment` | `cerood-shop-payments.js` | Route exists; payment not tested |
| `cerood-store-checkout.js` | `POST /api/shop/recover-razorpay-payment` | `cerood-shop-payments.js` | Route exists; recovery not tested |

## Verified migration blockers

1. `seller-dashboard-test/seller-api.js` on main hardcodes Render as its API origin. This branch switches it to same-origin in browsers. The Cloudflare Worker **must** proxy the seller routes, including `POST`, `PATCH`, authenticated `GET`, and multipart upload. Do not deploy this frontend change without its matching Worker.
2. `cerood-store-checkout.js` and `cerood-home-auth.js` still reference the Render origin. They require an explicit Cloudflare routing plan and end-to-end checks; do not blindly replace payment URLs.
3. Seller media upload is protected by seller authentication and writes to Supabase. It accepts JPEG/PNG/WebP up to 10 MB and MP4/WebM up to 25 MB. The Worker must preserve `Authorization`, multipart boundary, request body, status and JSON response. Cloudflare platform/request limits must be checked before enabling large uploads.
4. Backend repository currently tracks `.env` despite listing it in `.gitignore`. Treat any credentials it may contain as exposed, rotate them, and remove the file from Git history using an approved remediation process. **Do not copy secrets into issues, logs or pull requests.**
5. The existing Vercel `vercel.json` contains rewrites and redirects (seller pages, SEO, sitemap, local discovery). Cloudflare routing must achieve equivalent behavior before DNS cutover.

## Release gates

- [ ] Enumerate every frontend API request and match HTTP method, path, auth and response contract against backend routes.
- [ ] Verify CORS and same-origin routing for Home Services, shopping, sellers, admins and local discovery.
- [ ] Verify seller media upload and product approval using a designated non-customer test record.
- [ ] Verify booking, checkout, order lifecycle, Razorpay webhook signature and idempotency without charging real customers during tests.
- [ ] Verify SEO pages, canonical URLs, robots, sitemap index, redirects and 404s.
- [ ] Verify secrets remediation, deployment environment, DNS rollback and observability.
- [ ] Obtain explicit approval before production cutover.

This is a working audit checklist, not an authorization to deploy or mutate customer data.
