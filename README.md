# QR-to-Web Heat Reporting App

A German-language, mobile-first web application for anonymous heat-related issue reporting with AI-powered recommendations and public heatmap visualization.

## Overview

This application enables users to submit anonymous reports about heat-related issues at their location via QR code or direct link. After completing a questionnaire, users receive baseline results and can optionally request AI-generated recommendations. All submissions are aggregated and visualized in a public heatmap at the postal code level.

**Key Features:**

- 📱 Mobile-first design optimized for phones and tablets
- 📍 GPS and manual address location capture with geocoding
- 📝 Dynamic questionnaire managed in Payload CMS
- 🤖 On-demand AI recommendations (German) via n8n RAG workflow
- 🗺️ Public heatmap visualization with postal code aggregation
- 👥 Role-based access control (User, Editor, Admin)
- 📊 Admin dashboard with CSV export capabilities

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, shadcn/ui
- **CMS/Backend**: Payload CMS 3.68.5
- **Database**: MongoDB Atlas (with Vector Search for knowledge base)
- **Maps**: MapLibre GL JS + react-map-gl
- **Geocoding**: Self-hosted OSM-based stack (Nominatim + Photon)
- **AI Workflows**: n8n on Hostinger
- **Hosting**: Fly.io (web app), Hostinger (n8n)

## Quick Start

### Prerequisites

- Node.js 18.20.2+ or 20.9.0+
- pnpm 9+ or 10+
- MongoDB Atlas connection string
- (Optional) Self-hosted geocoding services (Nominatim/Photon)

### Development Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd AdaptMapKoeln
   pnpm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Required environment variables:

   ```env
   DATABASE_URI=mongodb+srv://...
   PAYLOAD_SECRET=your-secret-key
   N8N_RECOMMENDATION_ENDPOINT=https://...
   NOMINATIM_URL=http://localhost:8080
   PHOTON_URL=http://localhost:2322
   ```

3. **Start development server:**

   ```bash
   pnpm dev
   ```

4. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin`
   - Follow on-screen instructions to create your first admin user

5. **Generate TypeScript types:**
   ```bash
   pnpm generate:types
   ```

## Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Public-facing routes
│   │   ├── page.tsx         # Landing page
│   │   ├── consent/         # Privacy consent
│   │   ├── location/        # Location capture
│   │   ├── questionnaire/   # Dynamic questionnaire
│   │   ├── results/         # Results & AI CTA
│   │   └── heatmap/          # Public heatmap
│   └── (payload)/            # Payload admin routes
├── collections/
│   ├── Users/               # Auth with RBAC (user/editor/admin)
│   ├── Questions/           # Question definitions
│   ├── Questionnaires/      # Questionnaire versions
│   ├── Submissions/         # User submissions
│   └── KnowledgeBaseItems/   # RAG knowledge base
├── globals/
│   ├── siteSettings/        # Site configuration
│   └── legalContent/        # Legal pages content
├── components/              # React components
├── hooks/                   # Payload hooks
├── access/                  # Access control functions
└── payload.config.ts        # Main Payload config
```

## Core Features

### Collections

#### Users

Authentication-enabled collection with role-based access control:

- **Roles**: `user`, `editor`, `admin`
- **Editors**: Can manage questions, content, and knowledge base (but not scoring weights)
- **Admins**: Full system access including scoring weights, users, and exports

#### Questions

Question definitions managed by editors:

- Unique `key` identifier
- German title and description (`title_de`, `description_de`)
- Question types: `singleChoice`, `multiChoice`, `dropdown`, `slider`
- Editor-editable fields (texts, options, display)
- Admin-only scoring configuration (`adminScoring`)

#### Questionnaires

Questionnaire versions with configurable questions:

- Version tracking
- `isCurrent` flag (only one can be current)
- Relationship to Questions collection
- Draft/published status

#### Submissions

Anonymous user submissions:

- Location data (lat/lng, postal_code, city)
- Personal non-identifying fields
- Questionnaire version reference
- Answers stored as JSON (keyed by question key)
- Calculated `problem_index` (0-100 scale)
- Optional free text
- AI recommendation fields (generated on-demand)

#### KnowledgeBaseItems

Knowledge base for RAG (Retrieval-Augmented Generation):

- German title and content
- Tags and categories
- Status (draft/published)
- Embedding metadata for vector search

### Globals

#### siteSettings

General site configuration and settings.

#### legalContent

Legal pages content managed by editors:

- Impressum
- Privacy Policy (Datenschutzerklärung)
- Terms and Conditions (AGB)

### Access Control

Role-based access control (RBAC) is implemented across all collections:

- **Public**: Can submit questionnaires, view heatmap
- **Editors**: Can manage questions, questionnaires, knowledge base, legal content
- **Admins**: Full access including scoring weights, user management, exports

See `.cursor/rules/access-control.md` and `.cursor/rules/security-critical.mdc` for implementation patterns.

### Location Capture

Two methods for location capture:

1. **GPS Geolocation**: Browser geolocation API with automatic reverse geocoding
2. **Manual Address Input**: German address format (Straße, Hausnummer, PLZ, Stadt)

Both methods use self-hosted OSM-based geocoding services:

- **Nominatim**: Reverse geocoding (coordinates → postal code)
- **Photon**: Forward geocoding (address → coordinates)

### Questionnaire Engine

Dynamic questionnaire system that:

- Fetches current questionnaire from Payload CMS
- Validates at least one active question exists
- Renders one question per screen
- Supports all question types with validation
- Stores answers as JSON keyed by question key

### Scoring System

Admin-configurable scoring system:

- Per-question weights
- Per-option score mapping (for choice questions)
- Slider normalization rules
- Calculates `problem_index` (0-100 scale)
- Optional sub-scores per category

### AI Recommendations

On-demand AI recommendations via n8n:

- Triggered by user CTA button after submission
- Uses RAG (Retrieval-Augmented Generation) from knowledge base
- Generates German recommendations
- Results stored in submission record
- Retry logic for error handling

### Public Heatmap

Interactive heatmap visualization:

- Aggregated data at postal code level
- GeoJSON API endpoint with caching
- MapLibre GL JS with react-map-gl
- User location marker
- Color-coded legend (low/medium/high problem index)

### Admin Tools

Admin-only features:

- CSV export of submissions (with filtering)
- Basic dashboard with statistics
- Scoring weights management UI
- User and permission management

## API Endpoints

### Public Endpoints

- `POST /api/submit` - Submit questionnaire response
- `GET /api/heatmap` - Get aggregated heatmap data (GeoJSON)
- `GET /api/legal/:page` - Get legal page content

### Internal Endpoints

- `POST /api/geocode` - Convert address to coordinates
- `POST /api/reverse-geocode` - Convert coordinates to postal code
- `POST /api/ai/recommendation` - Generate AI recommendation (proxies to n8n)

### Admin Endpoints

- `GET /api/admin/export` - CSV export (admin-only)
- `GET /api/admin/stats` - Dashboard statistics (admin-only)

## Development

### Working with MongoDB

This project uses MongoDB Atlas. Ensure your connection string is configured in `.env`:

```env
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Geocoding Services Setup

**What are these services?** See [`docs/GEOCODING-SERVICES-EXPLAINED.md`](docs/GEOCODING-SERVICES-EXPLAINED.md) for a simple explanation.

**Quick summary:**

- **Nominatim**: Converts GPS coordinates → postal code/address (reverse geocoding)
- **Photon**: Converts address → GPS coordinates (forward geocoding)
- **Why self-host**: No rate limits, better performance, privacy

#### Local Development

For local development, set up self-hosted geocoding services using Docker:

```bash
docker-compose up
```

This starts:

- Nominatim on port 8080
- Photon on port 2322

#### Production (Hostinger VPS)

For production deployment on Hostinger VPS, use the dedicated geocoding services:

```bash
# Upload docker-compose.geocoding.yml to your VPS
# Then run:
docker-compose -f docker-compose.geocoding.yml up -d
```

**📖 Full setup guide**: See [`docs/geocoding-services-setup.md`](docs/geocoding-services-setup.md) for complete instructions including:

- Docker installation
- Service configuration
- Nginx reverse proxy setup
- SSL certificate setup
- Maintenance and troubleshooting

**Quick setup script**: Use `scripts/setup-geocoding-hostinger.sh` for automated setup on Hostinger VPS.

### Type Generation

After modifying collections or globals, regenerate TypeScript types:

```bash
pnpm generate:types
```

This updates `src/payload-types.ts` with the latest schema.

### Import Map Generation

After adding custom admin components, regenerate the import map:

```bash
pnpm generate:importmap
```

## Security Considerations

⚠️ **CRITICAL**: Follow security patterns from `.cursor/rules/security-critical.mdc`:

1. **Local API Access Control**: Always set `overrideAccess: false` when passing `user` to Local API operations
2. **Transaction Safety**: Always pass `req` to nested operations in hooks
3. **Prevent Hook Loops**: Use `context` flags to prevent infinite loops

See `.taskmaster/docs/cursor-rules-mapping.md` for detailed security patterns per task.

## Testing

### Run Tests

```bash
# Integration tests
pnpm test:int

# End-to-end tests
pnpm test:e2e

# All tests
pnpm test
```

## Production

### Build

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Deployment

This project is configured for deployment on:

- **Fly.io**: Main web application
- **Hostinger**: n8n workflows
- **MongoDB Atlas**: Database with Vector Search

See deployment configuration in:

- `fly.toml` - Fly.io configuration
- `Dockerfile` - Container configuration
- `next.config.js` - Next.js production optimizations

### Environment Variables (Production)

Ensure all required environment variables are set:

```env
DATABASE_URI=...
PAYLOAD_SECRET=...
N8N_RECOMMENDATION_ENDPOINT=...
NOMINATIM_URL=...
PHOTON_URL=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Performance Targets (MVP)

- Completion rate (start → submit): ≥ 60%
- Median time to complete: ≤ 3 minutes
- Valid postal code submissions: ≥ 90%
- Heatmap API p95 (cached): < 500ms
- AI CTA success rate: ≥ 95% (with retries)

## Project Management

This project uses Task Master AI for task management. See:

- `.taskmaster/docs/prd.txt` - Product Requirements Document
- `.taskmaster/docs/cursor-rules-mapping.md` - Cursor rules to tasks mapping
- `.taskmaster/tasks/tasks.json` - Task definitions

View tasks:

```bash
# Get all tasks
# Use task-master-ai MCP tools or check .taskmaster/tasks/tasks.json
```

## Resources

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Payload CMS LLM Context](https://payloadcms.com/llms-full.txt)
- [Next.js Documentation](https://nextjs.org/docs)
- [MapLibre GL JS](https://maplibre.org/)
- [n8n Documentation](https://docs.n8n.io/)

## License

MIT
