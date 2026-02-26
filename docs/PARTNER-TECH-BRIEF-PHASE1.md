# AdaptMap Köln - Technischer Statusbericht (Phase 1)

## 1) Was AdaptMap aktuell leistet

AdaptMap ist aktuell als mobile-first Webanwendung produktionsnah umgesetzt, um anonyme Hitzebelastungen in Köln zu erfassen, diese aggregiert als Heatmap sichtbar zu machen und auf Wunsch KI-gestützte Handlungsempfehlungen auszugeben.

Der Nutzungsfluss ist:
1. Standort erfassen (GPS oder Adresse)
2. Kurzen Fragebogen durchlaufen
3. Optional Freitext ergänzen
4. Anonymisierte Meldung absenden
5. Ergebnis + optional KI-Empfehlung abrufen
6. Öffentliche Heatmap mit aggregierten Werten ansehen

Wichtig: Die öffentliche Visualisierung zeigt keine Einzelmeldungen, sondern aggregierte Kennzahlen pro Raumsegment (u. a. PLZ-Aggregation/Tile-Aggregation).

---

## 2) Gesamtbild nach Phase 1 (Architektur & Zusammenspiel)

### Kernbausteine
- **Web-App + API**: Next.js 15 (App Router), React 19
- **Datenmodell + Admin/Ops**: Payload CMS 3 (in die Next.js-App integriert)
- **Persistenz**: MongoDB
- **Kartendarstellung**: MapLibre / react-map-gl
- **KI-Orchestrierung**: n8n (RAG-Workflow + KB-Sync)
- **Betrieb**: Docker Compose (Traefik, Redis, n8n, App)

### Laufzeit-Zusammenspiel
- Frontend sendet Meldungen an `POST /api/submit`
- API speichert strukturierte Submission in Payload/MongoDB
- Heatmap-APIs liefern aggregierte GeoJSON-Daten
- Bei explizitem User-Klick ruft `POST /api/ai/recommendation` einen n8n-Webhook auf
- n8n nutzt Knowledge Base + LLM, Antwort wird zurück in Submission gespeichert (Caching/Wiederverwendbarkeit)

---

## 3) Aktuelles Datenbankmodell

### 3.1 Produktrelevante Collections

1. **`submissions`** (zentrale Fachdaten)
   - Standort: `location.lat`, `location.lng`, `location.postal_code`, `city`, `street`
   - Fragebogendaten: u. a. `heatFrequency`, `heatIntensity`, `livingSituation`, `desiredChanges`
   - Optional: `personalFields`, `user_text`, `dynamicAnswers`
   - Ergebnisfelder: `problem_index`, `sub_scores`
   - KI-Felder: `aiFields.ai_summary_de`, `ai_recommendations_de`, `ai_referenced_kb_ids`, `ai_generated_at`
   - Access: öffentliches Erstellen erlaubt, Lesen/Ändern nur Admin

2. **`knowledge-base-items`** (RAG-Wissensbasis)
   - Inhaltlich kuratierte Maßnahmen/Tipps/Lösungen
   - Statuslogik (`draft`/`published`/`archived`)
   - Embedding-Metadaten unter `embeddingMetadata.*`
   - Hooks triggern Sync in Richtung Vektor-DB/n8n

3. **`questions`** und **`questionnaires`**
   - Datenmodell für dynamische Fragebögen ist vorhanden
   - Aktueller Frontend-Flow nutzt weiterhin v1-Hardcoding
   - API für aktiven Payload-Fragebogen ist schon vorhanden (`/api/questionnaire/current`)

### 3.2 Globals
- **`site-settings`**: Betriebs-/Kanalparameter, Map Defaults, Legal Content, Cookie Banner, n8n-Webhook-Pfade
- **`ui-copy`**: redaktionell pflegbare UI-Texte

### 3.3 Nutzer/Rollen
- `users` mit Rollen: `user`, `editor`, `admin`
- Editor/Admin-Rechte für redaktionelle Pflege und KB-Prozesse

---

## 4) API-Endpunkte (vorhanden / geplant)

### 4.1 Öffentliche Kern-APIs
- `POST /api/submit` - Meldung persistieren + Basisauswertung
- `GET /api/heatmap` - aggregierte Heatmap-Daten (GeoJSON)
- `GET /api/heatmap-grid` - tile-basierte Aggregation (GeoJSON)
- `GET /api/heatmap-settings` - Frontend-Konfiguration (Tile-Size/Opacity/Map-Center)
- `POST /api/ai/recommendation` - KI-Empfehlung für vorhandene Submission abrufen/generieren
- `GET /api/health` - Health Probe

### 4.2 Geocoding/Adresslogik
- `POST /api/geocode` - Adresse -> Koordinaten (LocationIQ/Photon-Fallback)
- `POST /api/reverse-geocode` - Koordinaten -> Adressbestandteile
- `GET /api/house-numbers` - Hausnummernvalidierung via Overpass
- `POST /api/validate-address` - Validierung Straße/Hausnummer/PLZ (Köln)

### 4.3 Knowledge-Base Ops (auth-geschützt)
- `POST /api/knowledge-base/import-excel`
- `POST /api/knowledge-base/sync-item`
- `POST /api/knowledge-base/sync-unsynced`

### 4.4 Fragebogen-API
- `GET /api/questionnaire/current` - aktiver Fragebogen aus Payload

### 4.5 Optional/neu in Phase 2 (Vorschlag)
- Versionierte API-Basis (`/api/v1/...`) für externe Integrationen
- Read-only Partner-Endpunkte für aggregierte Analytik mit API-Key
- `GET /api/system/info` (sanitized) für Betriebs-/Build-Metadaten

---

## 5) Systemanforderungen für Self-Hosting

### 5.1 Mindestanforderungen (Start)
- Linux-Server (Ubuntu/Debian), öffentliche IPv4
- Docker + Docker Compose
- Domain + DNS (Root + Subdomain `n8n.<domain>`)
- Ports 80/443 offen
- TLS via Traefik + ACME
- Externe MongoDB-Instanz (empfohlen: Atlas)

### Ressourcen (aus aktuellem Compose abgeleitet)
- Traefik: ~200 MB Limit
- Redis: ~600 MB Limit
- n8n: ~1.5 GB Limit
- App: ~2 GB Limit
- **Praktisch sinnvoll**: VPS mit mindestens **4 vCPU / 8 GB RAM**, besser 16 GB bei höherem KI-/Sync-Volumen

### 5.2 Setup-/Installationspfad (derzeit)
1. Server vorbereiten (Docker, Volumes, DNS, Firewall)
2. `.env` mit Domain/Secrets/DB/API-Keys setzen
3. `docker-compose.hostinger.yml` deployen (Traefik/Redis/n8n/App)
4. Payload Admin initialisieren (User, Globals, Webhook-URLs)
5. Healthcheck und End-to-End Smoke-Test

### 5.3 Setup-Pfad (empfohlene Weiterentwicklung)
- Kurzes Install-Skript + `.env.template` + one-command bootstrap
- Optionales Helm/K8s-Profil erst bei Multi-Tenant/hoher Last
- Separate Betriebshandbücher für:
  - "Single-VPS"
  - "Managed DB + GitLab CI"

---

## 6) Qualitätssicherung - Ist-Stand

### 6.1 Bereits vorhandene Tests
- **Integration (Vitest)**: vorhanden (`tests/int/**`)
- **E2E (Playwright)**: vorhanden (`tests/e2e/**`)

### 6.2 Realistische Einordnung
- Testframeworks sind eingerichtet, aber die vorhandenen Tests sind aktuell eher baseline/smoke als vollumfängliche fachliche Absicherung.
- Es gibt aktuell **keine GitLab-CI**, und die bestehende GitHub-Deploy-Pipeline führt vor Deployment keine vollständige Test-Gate-Pipeline aus.

---

## 7) GitLab CI inkl. automatisierter Tests - tentative Pläne

Da die Zielplattform GitLab ist, sind drei sinnvolle Ausbaustufen möglich.

### Plan A (schnell, 1-2 Tage)
- Stages: `lint -> typecheck -> test:int -> build`
- E2E zunächst manuell oder nightly
- Vorteil: sofortiges Qualitäts-Gate bei MR
- Nachteil: begrenzte UI-Absicherung

### Plan B (balanciert, 3-5 Tage) - **empfohlen**
- Stages: `lint -> typecheck -> test:int -> e2e (headless) -> build -> deploy`
- E2E nur auf `main` und Release-Branches, optional MR-label-gesteuert
- Docker Image Build als eigenes Job-Artefakt
- Vorteil: guter Schutz vor Regressionen bei akzeptabler Laufzeit

### Plan C (streng, 1-2 Wochen)
- Zusätzlich:
  - Testcontainers für Mongo-Integration
  - Contract-Tests für n8n-Webhook-Antwortschemas
  - Performance-Smoke (Heatmap-Aggregation)
  - Security-Scan (SAST/Dependency)
- Vorteil: hohes Vertrauen für Partnerbetrieb
- Nachteil: höherer Setup- und Wartungsaufwand

### Vorschlag für ersten `.gitlab-ci.yml`-Zuschnitt
```yaml
stages:
  - lint
  - typecheck
  - test
  - build

default:
  image: node:20
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .pnpm-store
      - node_modules/

before_script:
  - corepack enable
  - pnpm install --frozen-lockfile

lint:
  stage: lint
  script:
    - pnpm lint

typecheck:
  stage: typecheck
  script:
    - pnpm exec tsc --noEmit

test:int:
  stage: test
  script:
    - pnpm test:int

build:
  stage: build
  script:
    - pnpm build
```

---

## 8) Architekturentscheidungen (n8n, Payload, LLM vs. regelbasiert)

### 8.1 Rolle von n8n im Backend/KI-Setup
**Aktuelle Rolle**
- Entkopplung der KI- und KB-Sync-Workflows von der Kern-App
- Schnellere Iteration bei Prompting/Workflow-Logik ohne App-Redeploy

**Stärken**
- Hohe Änderbarkeit
- Gute Integration externer Services
- Klarer operativer Ort für AI-Orchestrierung

**Risiken**
- Zusätzliche Betriebsdomäne (Monitoring/Versionierung der Workflows)
- Antwortzeiten und Fehlerbilder hängen von n8n-Workflowqualität ab

### 8.2 Rolle von Payload CMS (Langfristigkeit/Lizenz/Abhängigkeit)
**Aktuelle Rolle**
- Datenmodell, Admin-Backend, Auth/RBAC, Globals, API-Grundlage

**Strategische Bewertung**
- Gute Fit-Lösung für schnelles Produkt- und Content-Iterieren
- Daten liegen in MongoDB, damit bleibt Migrationsfähigkeit gegeben

**Abhängigkeitsrisiken**
- Hohe Kopplung an Payload-Konventionen in Admin und Collection-Logik
- Bei spätem Plattformwechsel entsteht Mapping-Aufwand (Schemas, Hooks, Access)

**Empfohlene Gegenmaßnahme**
- Domänenlogik stärker in dedizierte Services/Utilities auslagern (nicht nur in Collection Hooks), damit ein späteres Replatforming kalkulierbar bleibt.

### 8.3 Wo LLM klar Mehrwert bringt vs. wo Regeln besser sind
**LLM mit klarem Mehrwert**
- Personalisierte, textuelle Handlungsempfehlungen
- Kontextualisierung aus heterogenen Quellen (RAG)
- Sprachliche Aufbereitung in nutzerfreundlichem Deutsch

**Regelbasiert klar sinnvoller**
- Validierung (PLZ, Eingabeformate, Pflichtfelder)
- Scoring- und Aggregationslogik (deterministisch, auditierbar)
- Routing/Fallback (Geocoding, Retry/Timeout)

**Empfohlene Hybridlinie**
- Core-Entscheidungen und Kennzahlen strikt regelbasiert
- LLM nur für Generierung/Erklärung
- LLM-Ausgaben schematisch validieren und versionieren

---

## 9) Geplante Überführung nach GitLab

Da ein Überblick für weitere Partner kurzfristig wichtig ist, ist folgender Transferpfad pragmatisch:

1. Repository in GitLab importieren (Historie vollständig)
2. Branch-Schutz + MR-Template + CODEOWNERS
3. GitLab CI Plan A sofort aktivieren
4. Secrets/Variables in GitLab setzen (DB, Payload, Deploy SSH, Domains)
5. Danach schrittweise auf Plan B erweitern

### Konträrer, aber sinnvoller Vorschlag
Statt "harter Umzug an Tag 1": für 2-4 Wochen **Dual-Track** (GitHub als Fallback, GitLab als führende CI) fahren. Das reduziert Migrationsrisiko, wenn Deploy/Secrets/Runner anfangs noch nicht sauber sitzen.

---

## 10) Offene Punkte / Entscheidungen

1. Soll der dynamische Payload-Fragebogen in Phase 2 den hardcodierten Frontend-v1-Flow vollständig ablösen?
2. Gewünschtes Zielniveau für Tests bis Partner-Onboarding:
   - nur Build-Sicherheit (Plan A)
   - oder produktionsnahe E2E-Gates (Plan B)?
3. Soll n8n mittel- bis langfristig "nur AI-Orchestrierung" bleiben oder zusätzlich Business-Automation übernehmen?
4. Bevorzugte GitLab-Deploy-Strategie:
   - Build-on-runner + Push Registry + Pull on VPS
   - oder weiterhin Image-Tar-Transfer per SSH (wie heute in GitHub Actions)?

---

## 11) Kurzfazit

Nach Phase 1 ist AdaptMap in einer belastbaren Produktbasis angekommen: funktionsfähiger End-to-End-Flow, tragfähiges Datenmodell, klar getrennte Rollen von App/Payload/n8n und containerisierter Betrieb. Für den Partner-Einstieg sind die wichtigsten nächsten Hebel jetzt **GitLab-CI mit Test-Gates**, **klarere Betriebsprozesse** und **Entscheidung über den finalen Fragebogen-Source-of-Truth**.
