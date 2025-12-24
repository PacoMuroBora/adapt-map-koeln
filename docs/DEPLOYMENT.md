# Deployment Guide - Step by Step

This guide walks you through deploying the application to Hostinger VPS. No DevOps experience needed!

## 📋 Overview

Your deployment uses a **single Docker Compose file** that contains all services:

1. **Infrastructure Services** (set up once, rarely changes):
   - Traefik (reverse proxy with SSL)
   - Redis (cache)
   - n8n (workflow automation)

2. **App Service** (deploys automatically on every code push):
   - Next.js application (uses public geocoding APIs or LocationIQ)

All services are managed in `/docker/services/docker-compose.yml` via Hostinger's Docker Manager.

Both projects communicate via shared Docker networks.

---

## 🚀 Step 1: Initial Server Setup (One-Time)

### 1.1 Verify Docker is Running

SSH into your server and verify Docker is installed:

```bash
ssh root@your-server-ip
docker --version
```

**What this does:** Ensures Docker is available for running containers.

### 1.2 Create Required Volume

```bash
docker volume create traefik_data
```

**What this does:** Creates persistent storage for SSL certificates.

### 1.3 Create Project Directory

```bash
mkdir -p /docker/services
```

**What this does:** Creates folder where the Docker Compose file will live.

---

## 🏗️ Step 2: Deploy Infrastructure (One-Time Setup)

### 2.1 Create Environment File

```bash
nano /docker/services/.env
```

Add these variables (press `Ctrl+O` to save, `Ctrl+X` to exit):

```env
DOMAIN_NAME=adaptmap.de
SSL_EMAIL=your-email@example.com
GENERIC_TIMEZONE=Europe/Berlin
DATABASE_URI=your-mongodb-connection-string
PAYLOAD_SECRET=your-payload-secret
LOCATIONIQ_API_KEY=your-locationiq-api-key
LOCATIONIQ_BASE_URL=https://eu1.locationiq.com/v1
SMTP_HOST=
SMTP_USERNAME=
SMTP_PASSWORD=
CRON_SECRET=
SESSION_LOG_SECRET=
```

**Important:** 
- Replace `adaptmap.de` with your actual domain
- Use a real email for `SSL_EMAIL` (Let's Encrypt needs it)
- `DATABASE_URI` and `PAYLOAD_SECRET` should match your GitHub secrets
- `LOCATIONIQ_API_KEY` is optional - get free key at https://locationiq.com (5,000 requests/day free)

### 2.2 Deploy via Hostinger Dashboard

1. **Open Hostinger's Docker Manager** in your hosting panel
2. **Create a new project** named `adaptmap` (or `services`)
3. **Open the visual YAML editor**
4. **Copy and paste** the entire contents of `docker-compose.hostinger.yml` from this repository
5. **Click Deploy** or **Save**

**What happens:** Hostinger will:
- Store the file at `/docker/services/docker-compose.yml`
- Start all containers (Traefik, Redis, n8n, app)
- The app container will use `adaptmap-app:latest` image (deployed via GitHub Actions)

**How to verify it's working:**
```bash
# Check if containers are running
docker ps

# You should see: traefik, redis, n8n, adaptmap-app
```

---

## 📱 Step 3: Set Up GitHub Actions (One-Time)

### 3.1 Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

#### Add Variables (non-sensitive):
- `DOMAIN_NAME`: `adaptmap.de` (your domain without `https://`)
- `DEPLOY_HOST`: Your server IP address (e.g., `72.61.178.221`)
- `DEPLOY_USER`: `root` (or your SSH username)
- `DEPLOY_PORT`: `22` (or your SSH port if different)

#### Add Secrets (sensitive - click "New repository secret"):
- `DATABASE_URI`: Your MongoDB Atlas connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- `PAYLOAD_SECRET`: A random secret string (generate with: `openssl rand -base64 32`)
- `DEPLOY_SSH_KEY`: Your private SSH key
  - Copy the **entire** key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`
  - No extra spaces at the beginning or end

**Note:** The app service is already defined in the compose file, but it needs the `adaptmap-app:latest` Docker image which is built and deployed by GitHub Actions (see Step 3).

---

## 🔄 Step 4: Automatic Deployment (Happens on Every Push)

Once set up, **every time you push code to the `main` branch**, GitHub Actions will:

1. ✅ **Build** the Next.js app Docker image
2. ✅ **Transfer** it to your server
3. ✅ **Load** the image into Docker
4. ✅ **Restart** the app service in the existing compose file

**You don't need to do anything!** Just push your code.

---

## 📍 Directory Structure Summary

After setup, your server will have:

```
/docker/
└── services/              # Single project (Hostinger manages)
    ├── docker-compose.yml    # All services compose file
    └── .env                  # All environment variables
```

---

## 🔍 How to Check if Everything is Working

### Check Infrastructure Services:

```bash
# List all running containers
docker ps

# Check specific service logs
docker logs traefik
docker logs redis
docker logs n8n
```

### Check App Container:

```bash
# Check app container
cd /docker/services
docker compose ps app

# Check app logs
docker compose logs app
```

### Test URLs:

Once deployed, you should be able to access:
- `https://adaptmap.de` - Your main application
- `https://n8n.adaptmap.de` - n8n workflow automation

**Note:** SSL certificates take 2-5 minutes to generate after first deployment.

---

## 🛠️ Troubleshooting

### Infrastructure Not Starting

**Problem:** Containers keep restarting or won't start

**Solutions:**
```bash
# Check logs for errors
docker logs traefik
docker logs redis
docker logs n8n

# Verify .env file exists and has correct values
cat /docker/services/.env

# Check if Docker is running
docker ps
```

### App Not Deploying

**Problem:** GitHub Actions workflow fails

**Solutions:**
1. Check GitHub Actions logs (click on the failed workflow run)
2. Verify all secrets are set correctly in GitHub
3. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/your_key root@your-server-ip
   ```
4. Verify app compose file exists:
   ```bash
   ls -la /docker/app/docker-compose.yml
   ```

### Services Can't Communicate

**Problem:** App can't reach Redis or other services

**Solutions:**
```bash
# Check if networks exist
docker network ls | grep adaptmap

# Verify containers are on the same networks
docker inspect traefik | grep -A 10 Networks
docker inspect adaptmap-app_app | grep -A 10 Networks
```

### SSL Certificates Not Working

**Problem:** Getting HTTP instead of HTTPS

**Solutions:**
1. Wait 5-10 minutes (Let's Encrypt needs time)
2. Check Traefik logs:
   ```bash
   docker logs traefik | grep -i cert
   ```
3. Verify DNS is pointing to your server:
   ```bash
   nslookup adaptmap.de
   ```
4. Check if port 80 and 443 are open:
   ```bash
   netstat -tuln | grep -E ':(80|443)'
   ```

---

## 🔄 Updating Services

### Update Services

1. Edit `/docker/services/docker-compose.yml` in Hostinger's visual editor
2. Click **Deploy** or **Update**

### Update App

Just push to `main` branch - GitHub Actions handles it automatically!

### Manual App Update (if needed)

```bash
# On server
cd /docker/services
docker compose restart app
```

---

## 📚 What Each Service Does

- **Traefik**: Reverse proxy that handles SSL certificates and routes traffic
- **Redis**: Fast data storage for caching
- **n8n**: Workflow automation tool
- **App**: Your Next.js application (the main website)

## 🌍 Geocoding Services

The app uses **public geocoding APIs** with optional commercial service support:

### Option 1: LocationIQ (Recommended - European, Open Source Data)
- **Free tier**: 5,000 requests/day
- **European servers**: `eu1.locationiq.com`
- **Open source data**: Uses Nominatim/OpenStreetMap
- **Setup**: Get free API key at https://locationiq.com
- **Add to `.env`**: `LOCATIONIQ_API_KEY=your_api_key_here`

### Option 2: Public Services (Fallback - No Account Needed)
- **Nominatim**: `https://nominatim.openstreetmap.org` (1 req/sec limit)
- **Photon**: `https://photon.komoot.io` (fair use)
- **Automatic fallback**: If LocationIQ key not set, uses public services

**Why LocationIQ?**
- ✅ European servers (GDPR-friendly)
- ✅ Open source data (OpenStreetMap)
- ✅ Higher limits (5,000/day vs 1/sec)
- ✅ Free tier sufficient for most apps
- ✅ Same data quality as self-hosted Nominatim

---

## 🆘 Need Help?

1. Check container logs: `docker logs <container-name>`
2. Check service status: `docker service ls`
3. Verify environment variables: `cat /docker/services/.env` and `cat /docker/app/.env`
4. Check GitHub Actions logs for deployment issues

---

## ✅ Quick Checklist

Before your first deployment, make sure:

- [ ] Docker is installed and running
- [ ] `traefik_data` volume created (if not exists, Docker Compose will create it)
- [ ] `/docker/services/` directory exists with `.env` and `docker-compose.yml`
- [ ] All services deployed via Hostinger dashboard
- [ ] All GitHub secrets and variables set
- [ ] DNS records point to your server (A record for `*.adaptmap.de`)
- [ ] Ports 80 and 443 are open in firewall

Once all checked, push to `main` and watch GitHub Actions deploy your app! 🚀
