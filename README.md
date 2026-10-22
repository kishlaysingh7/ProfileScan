# ProfileFinder

Helps people review possible **public profile links for themselves**. It never performs face recognition or creates
biometric templates. Users may instead run a **photo-only reverse image search**, which finds public pages containing
the same image or a visually matching copy; name and username are optional.

```
frontend/   React + Vite + TypeScript + Tailwind UI
backend/    Node + Express + TypeScript API (search jobs, providers, validation, rate limiting)
```

## Run locally

```bash
# terminal 1
cd backend
copy .env.example .env      # add only the provider keys you intend to use
npm install
npm run dev                 # http://localhost:4100

# terminal 2
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4100)
```

Tests / checks: `cd backend && npm test`, `cd frontend && npm run build`.

## What results are real

| Source | Platforms | Verification |
| --- | --- | --- |
| GitHub REST API | GitHub | **Verified** that the account exists (username lookup + name search) |
| Brave Search API (needs `BRAVE_SEARCH_API_KEY`) | Instagram, Facebook, LinkedIn, X, TikTok, YouTube | Unverified suggestions: public profile pages returned by web search for the name |
| Direct links | All except GitHub | Unverified: links to the platform's profile page for each username, plus the platform's own public search page |

Instagram, Facebook, LinkedIn, X and TikTok do not offer a public API to look up people, and scraping them
violates their terms, so ProfileFinder never fetches those sites. Without a web-search key you get direct links
you can open and check yourself. Nothing is ever "confirmed" until the user confirms it, and no completeness is
claimed.

Offline demo data is still available with `VITE_USE_DEMO=true` in `frontend/.env`.

## Photo-only reverse image search

The app supports two distinct reverse-image-search providers:

| Provider | User input | Required server configuration | Result |
| --- | --- | --- | --- |
| Google Vision Web Detection | Local JPG, PNG, or WEBP upload (up to 5 MB) | `GOOGLE_VISION_API_KEY` | Matching public pages and image URLs |
| SerpApi Google Lens | Already-public HTTPS image URL | `SERPAPI_KEY` | Exact and visually similar public source pages |

For **Google Vision**, set `GOOGLE_VISION_API_KEY` in `backend/.env`. The browser sends the uploaded image to the
backend over HTTPS; it is forwarded only for the single Google Vision request, is not written to disk or retained in
a job, and no face detection or face vector is requested. Results are public web source pages and matching-image URLs,
not people or social accounts. Results can be empty, incomplete, or unrelated, and the service makes no ownership
claim.

If the key is missing, the API rejects the request and does not call an image provider. Obtain and restrict the key
according to [Google Cloud Vision setup](https://cloud.google.com/vision/docs/setup), including API and server-IP
restrictions.

### No-cost development mode

Set `MOCK_IMAGE_SEARCH=true` in `backend/.env` to develop the entire photo upload, job-progress, and results flow
without a Google Vision key or any API request. It returns two fixed `example.com` demonstration results and labels
them clearly in the UI. Never enable this option in a deployed environment; set it back to `false` and configure
`GOOGLE_VISION_API_KEY` for a real reverse-image-search provider.

### SerpApi Google Lens for public image URLs

Set `SERPAPI_KEY` in `backend/.env` to enable the public-image URL option. SerpApi's Google Lens API takes a public
image URL rather than a local file, so the app never uploads a local file to SerpApi. The backend enforces
`SERPAPI_MONTHLY_LIMIT=250` by default, matching SerpApi's published free-tier allowance; lower that value if you
need to reserve part of the monthly quota. The counter is in memory, so use a shared durable counter before running
multiple backend instances. The URL must use HTTPS and must be an image the user already has permission to search.

Provider pricing can change. Before enabling either service, review [Google Vision pricing](https://cloud.google.com/vision/pricing)
and [SerpApi pricing](https://serpapi.com/pricing), set provider-side spend/quota alerts, and keep the app-level
SerpApi limit at or below the allowance you intend to use.

## Service management

The in-app **Services** page shows whether each backend integration is configured and links to its provider setup
documentation. It never displays, accepts, or stores API keys in the browser. Configure `GITHUB_TOKEN`,
`BRAVE_SEARCH_API_KEY`, `GOOGLE_VISION_API_KEY`, and `SERPAPI_KEY` only in `backend/.env`; use
`backend/.env.example` as the template.

## Verifying ownership (no face matching)

ProfileFinder does **not** compare faces or give match percentages: that would let anyone locate a stranger's accounts
from a photo. Instead a user proves a profile is theirs with a bio code: they add a one-time code (`pf-…`, 30-minute
expiry) to their own bio, and the backend checks the public page (GitHub via its API; other platforms by reading the
single public profile URL, with redirects and hosts restricted to that platform). If a platform requires login or
blocks the request the result is `unreachable` rather than guessed. Verified profiles get an **Ownership verified**
badge and are saved as confirmed.

## API

- `POST /api/search-jobs` `{ consent: true, name?, usernames?, platforms[] }` → `202` job
- `GET /api/search-jobs/:id` → status, per-platform progress, results
- `DELETE /api/search-jobs/:id`
- `POST /api/image-search-jobs` — raw `image/jpeg`, `image/png`, or `image/webp` body with
  `X-ProfileFinder-Consent: true`; creates a temporary Google Vision Web Detection job
- `POST /api/image-url-search-jobs` `{ consent: true, imageUrl }` — creates a SerpApi Google Lens job for an
  already-public HTTPS image URL
- `GET` / `DELETE /api/image-search-jobs/:id`
- `POST /api/verifications` `{ consent: true, platform, profileUrl }` → one-time bio code; `POST /api/verifications/:id/check` → `verified` / `code-not-found` / `unreachable` / `expired`
- `GET /api/health`, `GET /api/capabilities`

## Production checklist

Done: input validation (zod), helmet, CORS allow-list, rate limiting, 10 kB body limit, HTTPS-only upstream calls with
timeouts, unguessable job IDs with 30-minute expiry, audit log without personal data, graceful shutdown.

## Deploying with Render and GitHub Pages

GitHub Pages hosts the static React frontend only. The Node/Express API runs separately on Render so API credentials
remain server-side.

1. In Render, select **New** → **Blueprint** and connect this GitHub repository. Render reads `render.yaml` and
   creates the `profilescan-api` service. If you create the service manually, set the build command to
   `npm ci --include=dev && npm run build`; the TypeScript build needs development dependencies even though the
   running service uses `NODE_ENV=production`.
2. In the Render service environment settings, enter the provider keys you intend to use:
   `GOOGLE_VISION_API_KEY`, `SERPAPI_KEY`, `GITHUB_TOKEN`, and `BRAVE_SEARCH_API_KEY`. Do not add them to GitHub
   Actions or commit them to the repository.
3. After Render deploys, copy the service URL, for example `https://profilescan-api.onrender.com`.
4. In GitHub, open **Settings** → **Secrets and variables** → **Actions** → **Variables** and create:

   ```text
   VITE_API_BASE_URL=https://profilescan-api.onrender.com
   ```

5. In GitHub, open **Settings** → **Pages** and set the source to **GitHub Actions**.
6. Open **Actions** → **Deploy frontend to GitHub Pages** → **Run workflow**. The deployed site will be available at
   `https://kishlaysingh7.github.io/ProfileScan/`.

The Render configuration permits browser requests from `https://kishlaysingh7.github.io`. If you use a custom domain,
update Render's `CORS_ORIGIN` to the custom site's origin before publishing.

Still to build before a public launch:
- Email accounts + sessions, PostgreSQL for saved profiles, `DELETE /api/account/data`, `/api/profiles` endpoints (saved
  profiles currently live in the browser's localStorage).
- Shared job store (Redis) if running more than one backend instance – jobs are in memory today.
- Shared monthly SerpApi quota counter (Redis or PostgreSQL) if running more than one backend instance; the current
  quota counter is process-local.
- Deploy: frontend static hosting with `VITE_API_BASE_URL`; backend with `NODE_ENV=production`, `CORS_ORIGIN`,
  `TRUST_PROXY`, HTTPS at the proxy.
- Legal review of the privacy policy and terms (currently drafts); confirm Brave/GitHub API terms for your use.
