# Next.js Build Strategy & MongoDB Hosting Options

**Should you build Next.js on the VPS? Should you self-host MongoDB?**

---

## Question 1: Next.js Builds on the VPS?

### The Problem

**Building Next.js on a 2 vCPU, 8GB RAM VPS:**
- ⚠️ **Very slow** - Builds can take 5-15 minutes
- ⚠️ **Resource intensive** - Uses 2-4GB RAM during build
- ⚠️ **Blocks other services** - Nominatim, n8n may slow down
- ⚠️ **Disk I/O intensive** - Can slow down database operations

### Better Options

#### Option A: Build Locally, Push Image (Recommended)

**How it works:**
1. Build Docker image on your local machine (or CI/CD)
2. Push to Docker Hub or GitHub Container Registry
3. Pull and run on VPS

**Benefits:**
- ✅ Fast builds (your local machine is likely faster)
- ✅ No resource usage on VPS
- ✅ VPS only runs the app, not builds
- ✅ Can use GitHub Actions or similar for automated builds

**Setup:**

```bash
# On your local machine or CI/CD
docker build -t yourusername/adaptmap-koeln:latest .
docker push yourusername/adaptmap-koeln:latest

# On VPS - just pull and run
docker pull yourusername/adaptmap-koeln:latest
docker-compose up -d nextjs-app
```

**docker-compose.yml on VPS:**
```yaml
  nextjs-app:
    image: yourusername/adaptmap-koeln:latest  # Use pre-built image
    restart: always
    # ... rest of config
```

#### Option B: Build on VPS (Not Recommended)

**Only if:**
- You have no CI/CD setup
- You don't mind slow builds
- You can accept downtime during builds

**docker-compose.yml:**
```yaml
  nextjs-app:
    build:
      context: .
      dockerfile: Dockerfile
    # ... rest of config
```

**Issues:**
- Builds take 10-20 minutes on 2 vCPU
- Uses 3-4GB RAM during build
- Other services may be slow/unresponsive
- Need to stop app during rebuild

#### Option C: Use GitHub Actions / CI/CD (Best Practice)

**Automated workflow:**
1. Push code to GitHub
2. GitHub Actions builds Docker image
3. Pushes to Docker Hub/GitHub Container Registry
4. VPS automatically pulls new image (or manual trigger)

**Benefits:**
- ✅ No local machine needed
- ✅ Automated builds on every push
- ✅ Fast builds (GitHub runners are powerful)
- ✅ VPS never builds, only runs

**Example GitHub Actions workflow:**
```yaml
# .github/workflows/docker-build.yml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t yourusername/adaptmap-koeln:${{ github.sha }} .
      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push yourusername/adaptmap-koeln:${{ github.sha }}
          docker tag yourusername/adaptmap-koeln:${{ github.sha }} yourusername/adaptmap-koeln:latest
          docker push yourusername/adaptmap-koeln:latest
```

---

## Question 2: Self-Host MongoDB on VPS?

### Current Setup

**You're using MongoDB Atlas:**
- ✅ Cloud-hosted (managed)
- ✅ Automatic backups
- ✅ Scaling options
- ✅ Vector Search support (for knowledge base)
- ✅ No server management
- ✅ Cost: ~€0-10/month (free tier available)

### Self-Hosting MongoDB on VPS

**Resource Requirements:**
- RAM: 2-4GB (MongoDB is memory-intensive)
- Disk: 10-20GB (depends on data)
- CPU: Moderate

**With your 8GB VPS:**
- Current services: ~8GB RAM (optimized)
- Add MongoDB: +2-4GB RAM
- **Total: 10-12GB RAM** ❌ **Won't fit!**

### Comparison

| Aspect | MongoDB Atlas | Self-Hosted on VPS |
|--------|---------------|-------------------|
| **RAM Usage** | 0 GB (external) | 2-4 GB |
| **Setup Complexity** | Easy (5 min) | Complex (hours) |
| **Backups** | Automatic | Manual setup needed |
| **Updates** | Automatic | Manual |
| **Scaling** | Easy (click button) | Complex (migration) |
| **Vector Search** | ✅ Built-in | ❌ Complex setup |
| **Cost** | €0-10/month | €0 (but uses VPS resources) |
| **Reliability** | High (99.95% SLA) | Depends on your VPS |
| **Monitoring** | Built-in | Manual setup |

### Recommendation: Keep MongoDB Atlas

**Why:**
1. **RAM constraint** - Your 8GB VPS is already tight
2. **Vector Search** - Atlas has built-in vector search (needed for AI recommendations)
3. **Reliability** - Managed service is more reliable
4. **Backups** - Automatic backups included
5. **Cost** - Free tier available, paid tier is reasonable
6. **Focus** - You can focus on your app, not database management

**When to self-host:**
- ✅ You have 16GB+ RAM VPS
- ✅ You need data sovereignty (data must stay in EU)
- ✅ You have database admin experience
- ✅ You want to save costs (but you'll spend time managing it)

---

## Optimized VPS Setup (Recommended)

### What to Host on VPS

**✅ Host on VPS:**
- Traefik (reverse proxy)
- n8n (workflows)
- Redis (caching)
- RedisInsight (Redis UI)
- Nominatim (geocoding)
- Photon (geocoding)
- Next.js app (pre-built Docker image)

**✅ Keep External:**
- MongoDB Atlas (database)
- Docker Hub/GitHub Container Registry (for images)

### Resource Allocation (Optimized)

| Service | RAM | Disk | Notes |
|---------|-----|------|-------|
| Traefik | 100 MB | 100 MB | |
| n8n | 1.5 GB | 3 GB | |
| Redis | 512 MB | 500 MB | |
| RedisInsight | 300 MB | 100 MB | |
| Nominatim (NRW) | 3.5 GB | 12 GB | |
| Photon | 1 GB | 500 MB | |
| Next.js App | 1 GB | 1.5 GB | Pre-built image |
| System/OS | 500 MB | 5 GB | |
| **TOTAL** | **~8.4 GB** | **~23 GB** | ⚠️ Slightly over RAM |

**Solution:** Further optimize or upgrade to 12GB RAM VPS.

---

## Build Strategy Recommendation

### Recommended: GitHub Actions + Docker Hub

**Workflow:**
1. **Development:** Code on local machine
2. **CI/CD:** GitHub Actions builds on push
3. **Registry:** Push to Docker Hub
4. **VPS:** Pull pre-built image and run

**Benefits:**
- ✅ No builds on VPS (saves resources)
- ✅ Fast deployments
- ✅ Automated process
- ✅ Version control (tagged images)

**Setup Steps:**

1. **Create Docker Hub account** (free)
2. **Set up GitHub Actions** (see example above)
3. **Add secrets to GitHub:**
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
4. **Update docker-compose.yml on VPS:**
   ```yaml
   nextjs-app:
     image: yourusername/adaptmap-koeln:latest
     pull_policy: always  # Always pull latest
     restart: always
     # ... rest of config
   ```

5. **Deploy script on VPS:**
   ```bash
   #!/bin/bash
   docker-compose pull nextjs-app
   docker-compose up -d nextjs-app
   ```

---

## Alternative: Build on VPS (If You Must)

**If you can't use CI/CD, here's how to optimize builds on VPS:**

### 1. Use Build Cache

```yaml
  nextjs-app:
    build:
      context: .
      dockerfile: Dockerfile
      cache_from:
        - yourusername/adaptmap-koeln:latest
    # ... rest of config
```

### 2. Build During Low Traffic

```bash
# Build during off-peak hours
# Schedule via cron:
0 3 * * * cd /path/to/app && docker-compose build nextjs-app
```

### 3. Use Multi-Stage Build Efficiently

Your Dockerfile should already use multi-stage builds to minimize final image size.

### 4. Stop Non-Essential Services During Build

```bash
# Temporarily stop heavy services
docker-compose stop nominatim photon
docker-compose build nextjs-app
docker-compose start nominatim photon
docker-compose up -d nextjs-app
```

---

## MongoDB Strategy Recommendation

### ✅ Keep MongoDB Atlas

**Reasons:**
1. **RAM constraint** - Your VPS is already at capacity
2. **Vector Search** - Needed for AI recommendations, built into Atlas
3. **Reliability** - Managed service is more reliable
4. **Cost-effective** - Free tier or low-cost paid tier
5. **Less management** - Focus on your app, not database

**MongoDB Atlas Free Tier:**
- 512MB storage
- Shared cluster
- Perfect for development/small production

**MongoDB Atlas Paid (if needed):**
- M0 (Free): 512MB
- M10: 2GB RAM, 10GB storage - ~€50/month
- M20: 4GB RAM, 20GB storage - ~€100/month

**For your use case:** Free tier or M10 should be sufficient.

---

## Final Recommendations

### Build Strategy

**✅ Recommended:** GitHub Actions → Docker Hub → VPS
- Builds happen in cloud (fast, free)
- VPS only runs pre-built images
- Automated deployments

**⚠️ Alternative:** Build on VPS
- Only if you can't set up CI/CD
- Accept slow builds (10-20 min)
- Build during off-peak hours

### MongoDB Strategy

**✅ Recommended:** Keep MongoDB Atlas
- Fits your 8GB RAM constraint
- Vector Search support
- Managed service (less work)
- Cost-effective

**❌ Not Recommended:** Self-host MongoDB
- Won't fit in 8GB RAM
- Complex setup and maintenance
- No built-in Vector Search
- More work for minimal benefit

---

## Complete Setup Summary

**On VPS (8GB RAM):**
- Traefik, n8n, Redis, RedisInsight
- Nominatim, Photon (geocoding)
- Next.js app (pre-built image)

**External:**
- MongoDB Atlas (database)
- Docker Hub (image registry)
- GitHub Actions (builds)

**Result:**
- ✅ Everything fits in 8GB RAM
- ✅ Fast deployments (no builds on VPS)
- ✅ Reliable database (Atlas)
- ✅ Scalable architecture

---

**Need help setting up GitHub Actions?** I can create the workflow file for you!

