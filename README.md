# AdaptMap Köln — Heat Reporting + Public Heatmap + On‑Demand AI Recommendations

German-language, mobile-first web app for collecting **anonymous** heat-related reports and visualizing them as a **public heatmap**. After submitting, users can optionally request **AI-generated recommendations** (German) via an external n8n workflow backed by a Payload-managed knowledge base.

## What this app is for

- Quick “street-ready” reporting flow (QR/link → a few screens → submit)
- A structured dataset that can be analyzed later (with **postal-code aggregation** for public views)
- Content ops without redeploys: admins/editors manage UI copy, legal pages, knowledge base items, and (optionally) questionnaires in Payload
- Optional AI recommendations generated **only when the user clicks** the CTA (no background AI calls)

## The user journey (as implemented)

- **Landing** (`/`): CTA to start + embedded heatmap preview
- **Location** (`/location`): GPS (reverse geocode) or manual address (forward geocode)
- **Personal (optional)** (`/personal`): age/gender/household size
- **Questionnaire** (`/questionnaire/[step]`): currently a hardcoded set of questions (v1)
- **Feedback + consent** (`/feedback`): optional free text + mandatory data-collection consent → submits to API
- **Results** (`/results`): baseline “problem index” + AI CTA
- **Heatmap** (`/heatmap`): aggregated visualization + user marker (if available)

## Data flow (non-technical)

1. **A user opens the link** (often via QR code) and chooses a location (GPS or address).
2. **They answer a short questionnaire** (and optionally add a comment).
3. When they submit, the app **stores an anonymous report**:
   - location info (including postal code)
   - questionnaire answers
   - an automatically computed **heat problem index**
4. The public heatmap **does not show individual reports**. It groups reports by postal code and shows **averaged values** so you can see patterns without pinpointing a person.
5. If the user clicks **“KI‑Empfehlung erhalten”**, the app sends the report to an AI workflow, receives recommendations, and **stores them back** on the report so they can be shown again without re-running AI.

## Tech stack

- **Runtime**: Next.js 15 (App Router), React 19
- **CMS/Backend**: Payload CMS 3.68.5 (`@payloadcms/next`)
- **DB**: MongoDB (Atlas-friendly) via `@payloadcms/db-mongodb`
- **UI**: Tailwind + shadcn/ui
- **Maps**: MapLibre GL via `react-map-gl` + a custom influence-disk layer
- **AI**: n8n workflows (recommendations + KB sync)
- **Geocoding**: Photon/Nominatim style APIs with a pragmatic fallback chain (self-hosted or hosted)

## Architecture (how it’s built)

### High-level layout

```
src/
  app/
    (frontend)/                # Public pages (survey + heatmap)
    (payload)/                 # Payload admin + API wiring
    api/                       # Next API routes (submit, heatmap, geocode, AI, KB tools)
  collections/                 # Payload collections (Submissions, KnowledgeBaseItems, ...)
  globals/                     # Payload globals (SiteSettings, UiCopy)
  components/                  # UI + map + CTA components
  providers/Submission/        # Client-side session state (localStorage)
  utilities/                   # Cached globals, webhook URL resolver, caches
```

### Data model (Payload)

Core product collections:

- **`submissions`** (`src/collections/Submissions/index.ts`)
  - stores location, answers (normalized into fields), computed `problem_index` (0–100), optional `user_text`
  - stores AI output under `aiFields` when generated
  - **access**: create = public; read/update/delete = admin only
- **`knowledge-base-items`** (`src/collections/KnowledgeBaseItems/index.ts`)
  - editors/admins curate solutions/tips used by AI workflows
  - stores embedding metadata (`embeddingMetadata.*`) updated by sync hooks / endpoints
- **`questions`**, **`questionnaires`** exist and are fully modeled in Payload, but the frontend flow currently uses a hardcoded v1 set (see “Questionnaire source”).

Globals:

- **`site-settings`** (`src/globals/SiteSettings.ts`): site identity, map defaults, legal pages, cookie banner, n8n webhook config
- **`ui-copy`** (`src/globals/UICopy.ts`): strings for landing/consent/questionnaire/results

Note: `src/globals/LegalContent.ts` exists but is **not wired** into the active Payload config; legal pages are served from `site-settings.legalContent`.

### RBAC (roles)

Payload auth lives in **`users`** (`src/collections/Users/index.ts`) with roles:

- **Public**: can create `submissions`, can read published KB items, can read globals used by the frontend
- **Editor/Admin**: can manage KB items, questions/questionnaires, UI copy, and site settings

### Questionnaire source

There are two layers:

- **Frontend v1 (current)**: hardcoded questions at `src/app/(frontend)/questionnaire/questions.ts` (stored as `answers` JSON in the submission payload, then mapped to typed fields server-side).
- **Payload-driven (available via API)**: `GET /api/questionnaire/current` returns the active questionnaire from Payload (`questions` + `questionnaires` collections). This is currently not the source used by the frontend survey screens.

### API routes (Next)

Public:

- `POST /api/submit` — creates a `submissions` doc and returns baseline results (`src/app/api/submit/route.ts`)
- `GET /api/heatmap` — returns GeoJSON aggregated by postal code (`src/app/api/heatmap/route.ts`)
- `GET /api/health` — health probe (`src/app/api/health/route.ts`)

Location:

- `POST /api/geocode` — address → coordinates (Photon/LocationIQ fallback chain) (`src/app/api/geocode/route.ts`)
- `POST /api/reverse-geocode` — coordinates → postal code/city (Nominatim/LocationIQ fallback chain) (`src/app/api/reverse-geocode/route.ts`)

AI:

- `POST /api/ai/recommendation` — calls n8n, then writes AI output back onto the submission (`src/app/api/ai/recommendation/route.ts`)

Knowledge base ops (admin/editor, cookie-authenticated):

- `POST /api/knowledge-base/import-excel` — bulk import KB items from an Excel file (`src/app/api/knowledge-base/import-excel/route.ts`)
- `POST /api/knowledge-base/sync-item` — sync one KB item to vector DB via n8n (`src/app/api/knowledge-base/sync-item/route.ts`)
- `POST /api/knowledge-base/sync-unsynced` — sync all unsynced items (`src/app/api/knowledge-base/sync-unsynced/route.ts`)

Questionnaire:

- `GET /api/questionnaire/current` — returns the current active questionnaire from Payload (`src/app/api/questionnaire/current/route.ts`)
  - The **frontend survey** currently uses `src/app/(frontend)/questionnaire/questions.ts` as v1 defaults.

### Caching & performance

- **Payload instance caching**: `getPayloadClient()` caches Payload at module level to avoid MongoDB pool exhaustion (`src/lib/payload.ts`).
- **Heatmap caching**: `/api/heatmap` uses in-memory caching (5 minutes) + CDN-friendly headers.
- **Geocoding caching**: in-memory cache with 24h TTL (`src/utilities/geocodeCache.ts`).
- **Globals caching**: `unstable_cache` for globals (`src/utilities/getGlobals.ts`).

### Heatmap rendering

- API returns GeoJSON points aggregated by postal code (`/api/heatmap`).
- Frontend renders a custom **influence-disk** layer (MapLibre custom layer) via `src/components/HeatmapMap/InfluenceDiskLayer.ts`.
- Current default influence radius is **5km per point** (`DEFAULT_RADIUS_METERS = 5000` in `src/components/HeatmapMap/index.ts`).

### Privacy model (what’s stored vs what’s public)

- Stored (server-side): submissions include `location.lat/lng` and `postal_code` plus answers and computed scores.
- Public (heatmap): the API only exposes aggregated postal-code points and averaged scores, not raw submissions.

### Security & access-control notes (Payload)

- Payload Local API can **bypass access control by default** unless you explicitly set `overrideAccess: false` for user-scoped operations.
  - This is why `POST /api/submit` uses `overrideAccess: false` (public create is allowed by collection access).
- System-style operations (aggregation / internal workflows) intentionally use `overrideAccess: true` where needed.
- Always use the cached client `getPayloadClient()` (`src/lib/payload.ts`) to avoid creating multiple MongoDB connection pools.

## Local development

### Prerequisites

- Node.js `^18.20.2` or `>=20.9.0`
- **pnpm** `^9` or `^10`
- MongoDB connection string

### Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Then:

- App: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

### Environment variables (practical)

Minimum (see `.env.example`):

```env
DATABASE_URI=mongodb://127.0.0.1/your-database-name
PAYLOAD_SECRET=YOUR_SECRET_HERE
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

Common optional knobs:

```env
# n8n routing
N8N_DOMAIN=https://n8n.adaptmap.de
N8N_INTERNAL_URL=http://localhost:5678

# Geocoding fallback chain
LOCATIONIQ_API_KEY=...
LOCATIONIQ_BASE_URL=https://eu1.locationiq.com/v1
GEOCODING_URL=https://nominatim.openstreetmap.org
PHOTON_URL=https://photon.komoot.io
NEXT_PUBLIC_PHOTON_URL=https://photon.komoot.io

# Map tiles (optional)
NEXT_PUBLIC_MAPTILER_API_KEY=...
```

Also note: n8n webhook paths are primarily configured in Payload under **Global → Site Settings → n8n Webhooks** (`site-settings.n8nWebhooks.*`).

### Common scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
pnpm generate:types
pnpm generate:importmap
```

## Testing

```bash
pnpm test:int
pnpm test:e2e
pnpm test
```

## Deployment & ops

- Health endpoint: `GET /api/health`
- Payload runs inside Next (App Router). See `Dockerfile` and `docs/DEPLOYMENT.md` for the current deployment setup.

## Project docs / context

- PRD: `.taskmaster/docs/prd.txt`
- Geocoding: `docs/GEOCODING-SERVICES-EXPLAINED.md`, `docs/geocoding-services-setup.md`
- n8n + KB sync: `docs/n8n/README.md` and related files in `docs/n8n/`

## License

MIT
