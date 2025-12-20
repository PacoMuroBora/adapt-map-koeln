# Setting Up Geocoding Services via Hostinger Dashboard

**Quick guide for users with Hostinger YAML Editor access**

Since you've already set up n8n, Traefik, and Redis via the Hostinger dashboard, you can add geocoding services to your existing setup!

This guide shows how to integrate Nominatim and Photon with your existing Traefik, n8n, Redis, and RedisInsight services.

**💡 Hosting Everything on One VPS?** If you have 8GB RAM VPS, see [`docs/VPS-RESOURCE-ANALYSIS.md`](VPS-RESOURCE-ANALYSIS.md) for optimization strategies to fit all services (including Next.js app) on one server.

---

## Quick Setup Steps

### 1. Access Your Docker Compose Configuration

1. Log into Hostinger dashboard
2. Go to **Server Settings** → **Docker** (or similar)
3. Open **YAML Editor** or **Docker Compose** section

### 2. Complete docker-compose.yml Configuration

Here's your complete `docker-compose.yml` with all services (Traefik, n8n, Redis, RedisInsight, and the new geocoding services):

**Copy this entire configuration into your Hostinger YAML editor:**

```yaml
services:
  traefik:
    image: traefik
    command:
      - --api=true
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entryPoint.to=websecure
      - --entrypoints.web.http.redirections.entryPoint.scheme=https
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.mytlschallenge.acme.tlschallenge=true
      - --certificatesresolvers.mytlschallenge.acme.email=${SSL_EMAIL}
      - --certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json
    restart: always
    ports:
      - 80:80
      - 443:443
    volumes:
      - traefik_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro

  n8n:
    image: docker.n8n.io/n8nio/n8n
    labels:
      - traefik.enable=true
      - traefik.http.routers.n8n.rule=Host(`${SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.n8n.tls=true
      - traefik.http.routers.n8n.entrypoints=web,websecure
      - traefik.http.routers.n8n.tls.certresolver=mytlschallenge
      - traefik.http.middlewares.n8n.headers.SSLRedirect=true
      - traefik.http.middlewares.n8n.headers.STSSeconds=315360000
      - traefik.http.middlewares.n8n.headers.browserXSSFilter=true
      - traefik.http.middlewares.n8n.headers.contentTypeNosniff=true
      - traefik.http.middlewares.n8n.headers.forceSTSHeader=true
      - traefik.http.middlewares.n8n.headers.SSLHost=${DOMAIN_NAME}
      - traefik.http.middlewares.n8n.headers.STSIncludeSubdomains=true
      - traefik.http.middlewares.n8n.headers.STSPreload=true
      - traefik.http.routers.n8n.middlewares=n8n@docker
    environment:
      - N8N_HOST=${SUBDOMAIN}.${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN_NAME}/
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - N8N_PROXY_HOPS=1
    restart: always
    ports:
      - 127.0.0.1:5678:5678
    volumes:
      - n8n_data:/home/node/.n8n
      - /local-files:/files

  redis:
    image: redis:7-alpine
    restart: always
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - redis_data:/data

  redisinsight:
    image: redis/redisinsight:latest
    restart: always
    # IMPORTANT: only bind to localhost on the server
    ports:
      - 127.0.0.1:5540:5540
    volumes:
      - redisinsight_data:/data

  # ============================================================================
  # Geocoding Services - NEW
  # ============================================================================
  
  nominatim:
    image: mediagis/nominatim:4.2
    container_name: nominatim
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.http.routers.nominatim.rule=Host(`geocoding.${DOMAIN_NAME}`) || Host(`nominatim.${DOMAIN_NAME}`)
      - traefik.http.routers.nominatim.tls=true
      - traefik.http.routers.nominatim.entrypoints=web,websecure
      - traefik.http.routers.nominatim.tls.certresolver=mytlschallenge
      - traefik.http.services.nominatim.loadbalancer.server.port=8080
      - traefik.http.middlewares.nominatim-headers.headers.SSLRedirect=true
      - traefik.http.middlewares.nominatim-headers.headers.STSSeconds=315360000
      - traefik.http.routers.nominatim.middlewares=nominatim-headers@docker
    environment:
      # For Cologne/NRW region (faster, recommended for testing):
      # - PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
      # - REPLICATION_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-updates/
      # For all of Germany (production):
      - PBF_URL=https://download.geofabrik.de/europe/germany-latest.osm.pbf
      - REPLICATION_URL=https://download.geofabrik.de/europe/germany-updates/
      - IMPORT_WIKIPEDIA=false
      - IMPORT_US_POSTCODES=false
      - NOMINATIM_PASSWORD=${NOMINATIM_PASSWORD}
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/status']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 2h
    deploy:
      resources:
        limits:
          memory: 6G
        reservations:
          memory: 4G
    volumes:
      - nominatim-data:/var/lib/postgresql/14/main
      - nominatim-flatnode:/nominatim/flatnode

  photon:
    image: komoot/photon:latest
    container_name: photon
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.http.routers.photon.rule=Host(`geocoding.${DOMAIN_NAME}`) || Host(`photon.${DOMAIN_NAME}`)
      - traefik.http.routers.photon.tls=true
      - traefik.http.routers.photon.entrypoints=web,websecure
      - traefik.http.routers.photon.tls.certresolver=mytlschallenge
      - traefik.http.services.photon.loadbalancer.server.port=2322
      - traefik.http.middlewares.photon-headers.headers.SSLRedirect=true
      - traefik.http.middlewares.photon-headers.headers.STSSeconds=315360000
      - traefik.http.routers.photon.middlewares=photon-headers@docker
    environment:
      - NOMINATIM_HOST=nominatim
      - NOMINATIM_PORT=5432
      - NOMINATIM_DB=nominatim
      - NOMINATIM_USER=nominatim
      - NOMINATIM_PASSWORD=${NOMINATIM_PASSWORD}
    depends_on:
      nominatim:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:2322/api?q=test']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  traefik_data:
    external: true
  n8n_data:
    external: true
  redis_data:
  redisinsight_data:
  # Geocoding volumes
  nominatim-data:
    driver: local
  nominatim-flatnode:
    driver: local
```

**💡 Important Notes:**
- Replace `${DOMAIN_NAME}` with your actual domain (e.g., `yourdomain.com`)
- Replace `${SUBDOMAIN}` with your n8n subdomain (e.g., `n8n`)
- The geocoding services will be accessible at:
  - `https://geocoding.yourdomain.com` (Nominatim)
  - `https://geocoding.yourdomain.com` (Photon)
- Or use separate subdomains: `nominatim.yourdomain.com` and `photon.yourdomain.com`

#### Alternative: Use Path-Based Routing (If You Prefer One Subdomain)

If you want to use one subdomain with paths (e.g., `geocoding.yourdomain.com/nominatim` and `geocoding.yourdomain.com/photon`), use these labels instead:

```yaml
  nominatim:
    # ... other config ...
    labels:
      - traefik.enable=true
      - traefik.http.routers.nominatim.rule=Host(`geocoding.${DOMAIN_NAME}`) && PathPrefix(`/nominatim`)
      - traefik.http.routers.nominatim.tls=true
      - traefik.http.routers.nominatim.entrypoints=web,websecure
      - traefik.http.routers.nominatim.tls.certresolver=mytlschallenge
      - traefik.http.services.nominatim.loadbalancer.server.port=8080
      - traefik.http.middlewares.nominatim-stripprefix.stripprefix.prefixes=/nominatim
      - traefik.http.routers.nominatim.middlewares=nominatim-stripprefix@docker

  photon:
    # ... other config ...
    labels:
      - traefik.enable=true
      - traefik.http.routers.photon.rule=Host(`geocoding.${DOMAIN_NAME}`) && PathPrefix(`/photon`)
      - traefik.http.routers.photon.tls=true
      - traefik.http.routers.photon.entrypoints=web,websecure
      - traefik.http.routers.photon.tls.certresolver=mytlschallenge
      - traefik.http.services.photon.loadbalancer.server.port=2322
      - traefik.http.middlewares.photon-stripprefix.stripprefix.prefixes=/photon
      - traefik.http.routers.photon.middlewares=photon-stripprefix@docker
```

Then access via:
- `https://geocoding.yourdomain.com/nominatim/`
- `https://geocoding.yourdomain.com/photon/`

#### Option B: Create Separate Stack (Not Recommended)

If you prefer to keep geocoding services separate:

1. In the Hostinger dashboard, create a new Docker Compose stack
2. Name it `geocoding-services` or similar
3. Copy the entire contents of `docker-compose.geocoding.yml` from this repository
4. Paste into the YAML editor
5. Save

### 3. Set Environment Variables

In the Hostinger dashboard, find **Environment Variables** or **.env** section and ensure you have ALL of these:

**Existing variables (you should already have these):**
```env
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=n8n
SSL_EMAIL=your-email@example.com
GENERIC_TIMEZONE=Europe/Berlin
REDIS_PASSWORD=your_redis_password
```

**New variable to add:**
```env
NOMINATIM_PASSWORD=your_secure_password_here
```

**💡 Password Tips:**
- Use at least 16 characters
- Mix letters, numbers, and symbols
- Don't reuse passwords from other services
- Save it somewhere safe (password manager)

**Complete .env file should look like:**
```env
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=n8n
SSL_EMAIL=your-email@example.com
GENERIC_TIMEZONE=Europe/Berlin
REDIS_PASSWORD=your_redis_password
NOMINATIM_PASSWORD=your_secure_password_here
```

### 4. Deploy

1. Click **Deploy**, **Apply**, or **Start** in the dashboard
2. The services will start downloading images and begin the initial data import

### 5. Monitor Progress

In the Hostinger dashboard:

1. Look for **Logs** or **Container Logs** section
2. Select the `nominatim` container
3. Watch for import progress messages

**What to expect:**
- Images download: 5-10 minutes
- Data import: 1-8 hours (depending on region)
- Look for "Nominatim is ready" or "ready to accept requests" message

### 6. Verify It's Working

If you have terminal/SSH access:

```bash
# Check container status
docker ps

# Test Nominatim
curl "http://localhost:8080/reverse?format=json&lat=50.9375&lon=6.9603"

# Test Photon
curl "http://localhost:2322/api?q=Köln&limit=5"
```

Or use the Hostinger dashboard's built-in terminal/console if available.

---

## DNS Configuration

Before deploying, make sure your DNS is configured:

**For subdomain-based routing (recommended):**
- Add A record: `geocoding.yourdomain.com` → Your VPS IP address
- Or use separate subdomains:
  - `nominatim.yourdomain.com` → Your VPS IP
  - `photon.yourdomain.com` → Your VPS IP

**For path-based routing:**
- Add A record: `geocoding.yourdomain.com` → Your VPS IP address

Traefik will automatically obtain SSL certificates via Let's Encrypt once the services are running.

---

## Choosing Your Region

**For faster setup (recommended for testing):**

Edit the `PBF_URL` in the YAML editor to use NRW region:

```yaml
environment:
  - PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
  - REPLICATION_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-updates/
```

**Benefits:**
- ✅ Faster import (1-2 hours vs 4-8 hours)
- ✅ Less disk space needed (~10GB vs ~30GB)
- ✅ Less RAM needed (4GB vs 8GB)
- ✅ Perfect for Cologne/Köln area

**For production (all of Germany):**

Keep the default:
```yaml
environment:
  - PBF_URL=https://download.geofabrik.de/europe/germany-latest.osm.pbf
  - REPLICATION_URL=https://download.geofabrik.de/europe/germany-updates/
```

---

## Resource Management

If your VPS has limited resources, adjust memory limits:

```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Reduce from 6G if needed
    reservations:
      memory: 2G  # Reduce from 4G if needed
```

---

## Troubleshooting

### Services Won't Start

1. Check logs in the Hostinger dashboard
2. Verify environment variable `NOMINATIM_PASSWORD` is set
3. Check if ports 8080 and 2322 are available
4. Verify you have enough disk space and RAM

### Import Taking Forever

- This is normal! Initial import takes 1-8 hours
- Check logs to see progress
- Use NRW region for faster setup

### Can't Access Services

- If using Traefik: Check labels are correct
- If using direct ports: Check firewall allows ports 8080 and 2322
- Verify containers are running in dashboard

---

## Next Steps

Once services are running:

1. **Wait for initial import** (1-8 hours depending on region)
   - Monitor logs in Hostinger dashboard
   - Look for "Nominatim is ready" message

2. **Verify services are accessible:**
   ```bash
   # Test Nominatim (replace with your actual domain)
   curl https://geocoding.yourdomain.com/reverse?format=json&lat=50.9375&lon=6.9603
   
   # Test Photon
   curl https://geocoding.yourdomain.com/api?q=Köln&limit=5
   ```

3. **Update your Next.js app environment variables:**
   
   **For Vercel:**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com
     NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com
     ```
   - Or if using path-based routing:
     ```
     NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com/nominatim
     NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com/photon
     ```
   
   **For Fly.io:**
   ```bash
   fly secrets set NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com
   fly secrets set NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com
   ```

4. **Test from your Next.js app:**
   - The API routes in `src/app/api/geocode/route.ts` and `src/app/api/reverse-geocode/route.ts` will automatically use these URLs

---

## Quick Reference

**View logs:** Dashboard → Containers → nominatim/photon → Logs

**Restart services:** Dashboard → Containers → Restart button

**Update services:** Edit YAML → Save → Deploy

**Check status:** Dashboard → Containers → See running status

---

**Need more details?** See the full guide: `docs/geocoding-services-setup.md`

