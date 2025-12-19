# Geocoding Services Setup Guide

This guide explains how to set up and deploy self-hosted geocoding services (Nominatim and Photon) on Hostinger VPS for the AdaptMapKoeln project.

## Overview

We use two open-source geocoding services:

1. **Nominatim** - Reverse geocoding (coordinates → postal code + city)
2. **Photon** - Forward geocoding (address → coordinates)

Both services are based on OpenStreetMap (OSM) data and run in Docker containers.

## Why Self-Host?

- **No rate limits** - Public Nominatim has a 1 request/second limit
- **Reliability** - No dependency on external services
- **Performance** - Faster response times with local data
- **Cost** - Free and open-source

## Prerequisites

- Hostinger VPS with Docker and Docker Compose installed
- Minimum 4GB RAM (8GB recommended for Nominatim)
- At least 20GB free disk space (for OSM data)
- SSH access to the VPS

## Step 1: Install Docker and Docker Compose

If not already installed on your Hostinger VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

## Step 2: Upload Docker Compose File

Upload the `docker-compose.geocoding.yml` file from this repository to your Hostinger VPS:

```bash
# On your local machine
scp docker-compose.geocoding.yml user@your-hostinger-vps:~/geocoding-services/

# Or clone the repository on the VPS
cd ~
git clone <your-repo-url>
cd AdaptMapKoeln
```

## Step 3: Create Environment File

Create a `.env` file for sensitive configuration:

```bash
cd ~/geocoding-services  # or ~/AdaptMapKoeln
nano .env
```

Add the following (change the password!):

```env
# Nominatim database password
NOMINATIM_PASSWORD=your_secure_password_here_change_this

# Optional: Use a smaller region for faster import
# PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
```

**Important**: 
- Use a strong, unique password
- Don't commit this file to git (it should be in `.gitignore`)

## Step 4: Initial Setup and Data Import

The first run will download and import OSM data. This can take several hours:

```bash
# Navigate to project directory
cd ~/geocoding-services  # or wherever you placed the docker-compose file

# Start services (this will begin data import)
docker-compose -f docker-compose.geocoding.yml up -d

# Monitor progress
docker-compose -f docker-compose.geocoding.yml logs -f nominatim

# Check import status (in another terminal)
docker exec nominatim curl http://localhost:8080/status
```

**Expected timeline:**
- Germany full dataset: 4-8 hours (depending on VPS performance)
- North Rhine-Westphalia only: 1-2 hours
- Initial import is a one-time process

**Note**: You can edit `docker-compose.geocoding.yml` to use a smaller region (e.g., NRW) for faster initial setup.

## Step 5: Verify Services

Once import is complete, test the services:

```bash
# Test Nominatim reverse geocoding (Cologne coordinates)
curl "http://localhost:8080/reverse?format=json&lat=50.9375&lon=6.9603"

# Test Photon forward geocoding
curl "http://localhost:2322/api?q=Köln&limit=5"
```

Expected response from Nominatim:
```json
{
  "place_id": 123456,
  "licence": "...",
  "osm_type": "node",
  "osm_id": 123456,
  "lat": "50.9375",
  "lon": "6.9603",
  "display_name": "Cologne, North Rhine-Westphalia, Germany",
  "address": {
    "city": "Cologne",
    "state": "North Rhine-Westphalia",
    "postcode": "50667",
    "country": "Germany",
    "country_code": "de"
  }
}
```

## Step 6: Configure Firewall

Allow access to the services:

```bash
# If using UFW
sudo ufw allow 8080/tcp  # Nominatim
sudo ufw allow 2322/tcp  # Photon

# If using iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 2322 -j ACCEPT

# Save iptables rules (Ubuntu/Debian)
sudo netfilter-persistent save
```

## Step 7: Set Up Reverse Proxy with SSL (Recommended)

For production, use Nginx as a reverse proxy with SSL for secure access.

### Install Nginx and Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

### Create Nginx Configuration

Create `/etc/nginx/sites-available/geocoding`:

```nginx
# Rate limiting zone (add to /etc/nginx/nginx.conf http block)
# limit_req_zone $binary_remote_addr zone=geocoding:10m rate=10r/s;

# Nominatim reverse proxy
server {
    listen 80;
    server_name geocoding.yourdomain.com;  # Change to your domain

    # Nominatim endpoint
    location /nominatim/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add rate limiting (uncomment after adding zone to nginx.conf)
        # limit_req zone=geocoding burst=10 nodelay;
        
        # Increase timeouts for geocoding requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Photon endpoint
    location /photon/ {
        proxy_pass http://localhost:2322/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add rate limiting
        # limit_req zone=geocoding burst=20 nodelay;
    }
}
```

### Enable Rate Limiting

Edit `/etc/nginx/nginx.conf` and add inside the `http` block:

```nginx
http {
    # Rate limiting for geocoding services
    limit_req_zone $binary_remote_addr zone=geocoding:10m rate=10r/s;
    
    # ... rest of config
}
```

### Enable Site and Get SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/geocoding /etc/nginx/sites-enabled/
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d geocoding.yourdomain.com

# Certbot will automatically configure HTTPS
```

## Step 8: Update Next.js Environment Variables

In your Next.js app (on Vercel or Fly.io), add these environment variables:

### For Vercel

Go to Project Settings → Environment Variables:

```env
# Production
NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com/nominatim
NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com/photon

# Development (optional, for local testing)
NEXT_PUBLIC_GEOCODING_URL=http://localhost:8080
NEXT_PUBLIC_PHOTON_URL=http://localhost:2322
```

### For Fly.io

Add to `fly.toml` or use `fly secrets`:

```bash
fly secrets set NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com/nominatim
fly secrets set NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com/photon
```

## Step 9: Update Data (Optional)

To keep OSM data up-to-date, set up a cron job:

```bash
# Edit crontab
crontab -e

# Add weekly update (runs every Sunday at 2 AM)
0 2 * * 0 cd ~/geocoding-services && docker-compose -f docker-compose.geocoding.yml exec nominatim nominatim replication --once
```

## API Endpoint Implementation

Your Next.js API routes should call these services. See the implementation examples in the main documentation.

## Maintenance Commands

### Check Service Status

```bash
# Check if containers are running
docker-compose -f docker-compose.geocoding.yml ps

# Check logs
docker-compose -f docker-compose.geocoding.yml logs -f nominatim
docker-compose -f docker-compose.geocoding.yml logs -f photon

# Check resource usage
docker stats nominatim photon
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.geocoding.yml restart

# Restart specific service
docker-compose -f docker-compose.geocoding.yml restart nominatim
```

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.geocoding.yml pull

# Recreate containers with new images
docker-compose -f docker-compose.geocoding.yml up -d --force-recreate
```

### Stop Services

```bash
# Stop services (keeps data)
docker-compose -f docker-compose.geocoding.yml stop

# Stop and remove containers (keeps volumes/data)
docker-compose -f docker-compose.geocoding.yml down

# Remove everything including volumes (WARNING: deletes data!)
docker-compose -f docker-compose.geocoding.yml down -v
```

### Backup Data

```bash
# Backup Nominatim database
docker exec nominatim pg_dump -U nominatim nominatim > backup_$(date +%Y%m%d).sql

# Or backup volumes
docker run --rm \
  -v geocoding-services_nominatim-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/nominatim-backup-$(date +%Y%m%d).tar.gz /data
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.geocoding.yml logs nominatim

# Check disk space
df -h

# Check memory
free -h

# Check if ports are in use
sudo netstat -tulpn | grep -E '8080|2322'
```

### Import Taking Too Long

- Use a smaller region (edit `PBF_URL` in `docker-compose.geocoding.yml`):
  ```yaml
  - PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
  ```
- Increase VPS resources (RAM/CPU)
- Check if import is actually progressing: `docker-compose logs -f nominatim`

### Out of Memory Errors

- Reduce Nominatim memory limits in `docker-compose.geocoding.yml`:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 4G  # Reduce from 6G
  ```
- Use a smaller OSM region
- Upgrade VPS RAM

### Connection Refused

- Check if services are running: `docker-compose -f docker-compose.geocoding.yml ps`
- Check firewall rules: `sudo ufw status`
- Verify ports are accessible: `curl http://localhost:8080/status`
- Check container logs: `docker-compose -f docker-compose.geocoding.yml logs`

### Data Not Updating

- Check replication status: 
  ```bash
  docker exec nominatim nominatim replication --status
  ```
- Manually trigger update: 
  ```bash
  docker exec nominatim nominatim replication --once
  ```

### High Memory Usage

- Nominatim can use 4-8GB RAM depending on dataset size
- Monitor with: `docker stats nominatim`
- Consider using a smaller region if memory is limited

## Resource Requirements

### Minimum (for small region like NRW)
- **RAM**: 4GB
- **Disk**: 20GB
- **CPU**: 2 cores
- **Cost**: ~€5-10/month

### Recommended (for all of Germany)
- **RAM**: 8GB
- **Disk**: 50GB
- **CPU**: 4 cores
- **Cost**: ~€15-20/month

### Optimal
- **RAM**: 16GB
- **Disk**: 100GB
- **CPU**: 4+ cores
- **Cost**: ~€30-40/month

## Security Considerations

1. **Change default passwords** in `.env` file
2. **Use HTTPS** with reverse proxy (Nginx + Let's Encrypt)
3. **Implement rate limiting** in Nginx
4. **Restrict access** to specific IPs if possible (in Nginx config)
5. **Keep services updated** regularly
6. **Monitor logs** for suspicious activity
7. **Use firewall** to restrict access to necessary ports only

### Restricting Access by IP (Optional)

If you only want your Next.js app to access the services, add to Nginx config:

```nginx
location /nominatim/ {
    # Allow only specific IPs (your Vercel/Fly.io IPs)
    allow 76.76.21.0/24;  # Example: Vercel IP range
    deny all;
    
    proxy_pass http://localhost:8080/;
    # ... rest of config
}
```

## Quick Reference

### Start Services
```bash
docker-compose -f docker-compose.geocoding.yml up -d
```

### View Logs
```bash
docker-compose -f docker-compose.geocoding.yml logs -f
```

### Stop Services
```bash
docker-compose -f docker-compose.geocoding.yml stop
```

### Restart Services
```bash
docker-compose -f docker-compose.geocoding.yml restart
```

### Check Status
```bash
docker-compose -f docker-compose.geocoding.yml ps
```

## Next Steps

1. ✅ Set up Docker and Docker Compose on Hostinger VPS
2. ✅ Upload `docker-compose.geocoding.yml` to VPS
3. ✅ Create `.env` file with secure password
4. ✅ Start services and wait for initial data import
5. ✅ Configure Nginx reverse proxy with SSL
6. ✅ Update Next.js environment variables
7. ✅ Test API endpoints
8. ✅ Set up monitoring and backups

## Additional Resources

- [Nominatim Documentation](https://nominatim.org/release-docs/latest/)
- [Photon Documentation](https://github.com/komoot/photon)
- [OSM Data Downloads](https://download.geofabrik.de/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

## Support

For issues specific to this setup:
- Check Docker logs: `docker-compose -f docker-compose.geocoding.yml logs`
- Check service health: `docker-compose -f docker-compose.geocoding.yml ps`
- Monitor resource usage: `docker stats`

For Nominatim/Photon specific issues, refer to their official documentation.
