# VPS Resource Analysis: Hosting Everything on One Server

**Can you host all services on a Hostinger VPS with 2 vCPU, 8GB RAM, 100GB storage?**

## Quick Answer

**✅ YES, but with optimizations!**

Your VPS specs:
- ✅ **2 vCPU cores** - Sufficient
- ⚠️ **8 GB RAM** - Tight but workable with optimization
- ✅ **100 GB storage** - Plenty of space
- ✅ **8 TB bandwidth** - More than enough

---

## Resource Breakdown

### Current Services (from your docker-compose.yml)

| Service | RAM Usage | Disk Usage | CPU Usage | Notes |
|---------|-----------|------------|-----------|-------|
| **Traefik** | ~50-100 MB | <100 MB | Low | Reverse proxy |
| **n8n** | ~1-2 GB | ~2-5 GB | Moderate | Depends on workflows |
| **Redis** | ~500 MB-1 GB | <1 GB | Low | Caching |
| **RedisInsight** | ~200-500 MB | <100 MB | Low | Redis UI |
| **Nominatim** | **4-6 GB** | **30-50 GB** | High | ⚠️ Biggest resource user |
| **Photon** | ~1-2 GB | <1 GB | Low | Uses Nominatim data |
| **Next.js App** | ~500 MB-1 GB | ~1-2 GB | Moderate | Node.js app |

### Total Resource Requirements

**RAM:**
- **Minimum (optimized)**: ~7-8 GB
- **Recommended**: ~10-12 GB
- **Your VPS**: 8 GB ⚠️ (tight but possible)

**Disk:**
- **Minimum (NRW region)**: ~35-40 GB
- **Full Germany**: ~50-60 GB
- **Your VPS**: 100 GB ✅ (plenty of space)

**CPU:**
- **2 cores**: ✅ Sufficient for all services
- Initial Nominatim import will be slow (4-8 hours instead of 2-4 hours)

---

## Optimization Strategies

### 1. Reduce Nominatim Memory Usage (CRITICAL)

**Edit your docker-compose.yml:**

```yaml
  nominatim:
    # ... other config ...
    deploy:
      resources:
        limits:
          memory: 4G  # Reduce from 6G to 4G
        reservations:
          memory: 2G  # Reduce from 4G to 2G
```

**Benefits:**
- Frees up 2GB RAM for other services
- Nominatim will still work, just slightly slower queries

### 2. Use NRW Region Instead of All Germany

**Edit docker-compose.yml:**

```yaml
  nominatim:
    environment:
      # Use NRW only (much smaller dataset)
      - PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
      - REPLICATION_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-updates/
```

**Benefits:**
- Disk: ~10GB instead of ~30GB (saves 20GB)
- RAM: ~3-4GB instead of 4-6GB (saves 1-2GB)
- Import time: 1-2 hours instead of 4-8 hours
- Perfect for Cologne/Köln area

### 3. Optimize Redis Memory

```yaml
  redis:
    command: [
      "redis-server",
      "--appendonly", "yes",
      "--requirepass", "${REDIS_PASSWORD}",
      "--maxmemory", "512mb",  # Limit Redis to 512MB
      "--maxmemory-policy", "allkeys-lru"  # Evict least recently used
    ]
```

**Benefits:**
- Limits Redis to 512MB instead of 1GB
- Frees up ~500MB RAM

### 4. Optimize n8n Memory

```yaml
  n8n:
    environment:
      # ... existing vars ...
      - NODE_OPTIONS=--max-old-space-size=1024  # Limit to 1GB
```

**Benefits:**
- Limits n8n to 1GB instead of 2GB
- Frees up ~1GB RAM

### 5. Use Next.js Standalone Build

**In `next.config.js`:**

```javascript
module.exports = {
  output: 'standalone',  // Smaller Docker image
  // ... other config
}
```

**Benefits:**
- Smaller Docker image (~200MB instead of ~500MB)
- Less disk space and faster deployments

---

## Optimized Resource Allocation

**With all optimizations:**

| Service | RAM (Optimized) | Disk | Total |
|---------|----------------|------|-------|
| Traefik | 100 MB | 100 MB | |
| n8n | 1 GB | 3 GB | |
| Redis | 512 MB | 500 MB | |
| RedisInsight | 300 MB | 100 MB | |
| Nominatim (NRW) | 3.5 GB | 12 GB | |
| Photon | 1 GB | 500 MB | |
| Next.js | 800 MB | 1.5 GB | |
| **System/OS** | 500 MB | 5 GB | |
| **Buffer** | 300 MB | 5 GB | |
| **TOTAL** | **~8 GB** | **~28 GB** | ✅ |

**Result:** Fits comfortably in 8GB RAM and 100GB disk!

---

## Recommended Configuration

### Complete Optimized docker-compose.yml

```yaml
services:
  traefik:
    # ... your existing config ...
    deploy:
      resources:
        limits:
          memory: 200M

  n8n:
    # ... your existing config ...
    environment:
      # ... existing vars ...
      - NODE_OPTIONS=--max-old-space-size=1024
    deploy:
      resources:
        limits:
          memory: 1.5G

  redis:
    # ... your existing config ...
    command: [
      "redis-server",
      "--appendonly", "yes",
      "--requirepass", "${REDIS_PASSWORD}",
      "--maxmemory", "512mb",
      "--maxmemory-policy", "allkeys-lru"
    ]
    deploy:
      resources:
        limits:
          memory: 600M

  redisinsight:
    # ... your existing config ...
    deploy:
      resources:
        limits:
          memory: 400M

  nominatim:
    # ... your existing config ...
    environment:
      # Use NRW region for smaller footprint
      - PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
      - REPLICATION_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-updates/
      # ... other vars ...
    deploy:
      resources:
        limits:
          memory: 4G  # Reduced from 6G
        reservations:
          memory: 2G  # Reduced from 4G

  photon:
    # ... your existing config ...
    deploy:
      resources:
        limits:
          memory: 1.5G

  nextjs-app:
    # Your Next.js app
    build: .
    restart: always
    labels:
      - traefik.enable=true
      - traefik.http.routers.app.rule=Host(`${DOMAIN_NAME}`)
      - traefik.http.routers.app.tls=true
      - traefik.http.routers.app.entrypoints=web,websecure
      - traefik.http.routers.app.tls.certresolver=mytlschallenge
      - traefik.http.services.app.loadbalancer.server.port=3000
    environment:
      - NODE_ENV=production
      - DATABASE_URI=${DATABASE_URI}
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}
      - NEXT_PUBLIC_GEOCODING_URL=https://geocoding.${DOMAIN_NAME}
      - NEXT_PUBLIC_PHOTON_URL=https://geocoding.${DOMAIN_NAME}
    deploy:
      resources:
        limits:
          memory: 1G
```

---

## Performance Expectations

### With Optimizations

**Normal Operation:**
- ✅ All services run smoothly
- ✅ Response times: Good (Nominatim queries: 100-500ms)
- ✅ Can handle moderate traffic

**Under Load:**
- ⚠️ Nominatim queries may slow down (500ms-2s)
- ⚠️ Next.js app may be slower during peak times
- ✅ Still functional, just not optimal

**Initial Import:**
- ⚠️ Nominatim import: 2-4 hours (instead of 1-2 hours)
- ⚠️ System will be slow during import
- ✅ Can still run other services (just slower)

---

## Monitoring and Alerts

### Set Up Resource Monitoring

**Add to your docker-compose.yml:**

```yaml
  # Optional: Add monitoring
  # prometheus:
  #   image: prom/prometheus
  #   # ... config ...
```

**Or use Hostinger's built-in monitoring if available.**

### Watch Resource Usage

```bash
# Check current usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

### Set Up Alerts

Monitor:
- RAM usage > 90%
- Disk usage > 80%
- CPU usage > 80% for extended periods

---

## Scaling Options

### If You Need More Resources Later

**Option 1: Upgrade VPS**
- Hostinger allows upgrading plans
- Move to 4 vCPU, 16GB RAM if needed

**Option 2: Split Services**
- Keep geocoding on Hostinger
- Move Next.js app to Fly.io (as originally planned)
- Best of both worlds

**Option 3: Optimize Further**
- Use smaller OSM region (city-level)
- Reduce cache sizes
- Use external MongoDB Atlas (already doing this)

---

## Recommendations

### ✅ Recommended Setup

1. **Use NRW region** for Nominatim (saves 20GB disk, 1-2GB RAM)
2. **Reduce memory limits** as shown above
3. **Monitor closely** for first few days
4. **Start with this setup**, upgrade if needed

### ⚠️ Things to Watch

1. **Memory pressure** - If you see OOM (Out of Memory) errors, reduce limits further
2. **Slow queries** - If Nominatim is too slow, consider upgrading RAM
3. **Disk space** - Monitor disk usage, especially during Nominatim import

### 🎯 Best Practice

**Start with optimizations, then:**
- Monitor for 1-2 weeks
- If everything works well → keep it
- If you see issues → either:
  - Further optimize
  - Upgrade VPS
  - Split services (Next.js to Fly.io)

---

## Cost Comparison

**Current Plan (Hostinger VPS):**
- 2 vCPU, 8GB RAM, 100GB disk
- Cost: ~€15-20/month
- Hosts: Everything

**Alternative (Split):**
- Hostinger VPS: Geocoding services (~€10-15/month)
- Fly.io: Next.js app (~€5-10/month)
- Total: ~€15-25/month

**Verdict:** Similar cost, but splitting gives better performance.

---

## Final Verdict

**✅ YES, you can host everything on your 8GB VPS!**

**With these optimizations:**
- ✅ All services will run
- ✅ Performance will be acceptable
- ✅ Cost-effective solution
- ⚠️ May need monitoring and fine-tuning

**Recommendation:**
1. Start with optimized configuration
2. Use NRW region for Nominatim
3. Monitor for 1-2 weeks
4. Upgrade or split if you encounter issues

---

## Quick Start Checklist

- [ ] Update docker-compose.yml with memory limits
- [ ] Change Nominatim to use NRW region
- [ ] Add Next.js service to docker-compose.yml
- [ ] Set up resource monitoring
- [ ] Deploy and monitor closely
- [ ] Adjust limits based on actual usage

---

**Need help with the optimized configuration?** See `docs/HOSTINGER-DASHBOARD-SETUP.md` for the complete setup guide.

