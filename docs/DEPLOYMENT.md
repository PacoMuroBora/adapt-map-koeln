# Deployment Guide - Step by Step

This guide walks you through deploying the application to Hostinger VPS. No DevOps experience needed!

## 📋 Overview

Your deployment has **two separate projects**:

1. **Infrastructure Project** (`/docker/services/`) - Set up **once**, rarely changes
   - Traefik (reverse proxy with SSL)
   - Redis (cache)
   - n8n (workflow automation)

2. **App Project** (`/docker/app/`) - Deploys **automatically** on every code push
   - Next.js application (uses public geocoding APIs or LocationIQ)

Both projects communicate via shared Docker networks.

---

## 🚀 Step 1: Initial Server Setup (One-Time)

### 1.1 Initialize Docker Swarm

SSH into your server and run:

```bash
ssh root@your-server-ip
docker swarm init
```

**What this does:** Enables Docker Swarm mode for managing multiple containers.

### 1.2 Create Required Volume

```bash
docker volume create traefik_data
```

**What this does:** Creates persistent storage for SSL certificates.

### 1.3 Create Project Directories

```bash
mkdir -p /docker/services
mkdir -p /docker/app
```

**What this does:** Creates folders where Docker Compose files will live.

---

## 🏗️ Step 2: Deploy Infrastructure (One-Time Setup)

### 2.1 Create Environment File for Infrastructure

```bash
nano /docker/services/.env
```

Add these variables (press `Ctrl+O` to save, `Ctrl+X` to exit):

```env
DOMAIN_NAME=adaptmap.de
SSL_EMAIL=your-email@example.com
GENERIC_TIMEZONE=Europe/Berlin
```

**Important:** 
- Replace `adaptmap.de` with your actual domain
- Use a real email for `SSL_EMAIL` (Let's Encrypt needs it)

### 2.2 Deploy Infrastructure via Hostinger Dashboard

1. **Open Hostinger's Docker Manager** in your hosting panel
2. **Create a new project** named `services` (or `adaptmap-services`)
3. **Open the visual YAML editor**
4. **Copy and paste** the entire contents of `docker-compose.hostinger-infra.yml` from this repository
5. **Click Deploy** or **Save**

**What happens:** Hostinger will:
- Store the file at `/docker/services/docker-compose.yml`
- Start all infrastructure containers (Traefik, Redis, n8n)
- This takes a few minutes

**How to verify it's working:**
```bash
# Check if containers are running
docker ps

# You should see: traefik, redis, n8n
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

### 3.2 Create App Environment File on Server

```bash
nano /docker/app/.env
```

Add these variables:

```env
DOMAIN_NAME=adaptmap.de
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
- Use the **same** `DOMAIN_NAME` as in `/docker/services/.env`
- `DATABASE_URI` and `PAYLOAD_SECRET` should match your GitHub secrets
- `LOCATIONIQ_API_KEY` is optional - get free key at https://locationiq.com (5,000 requests/day free)
- If `LOCATIONIQ_API_KEY` is not set, app falls back to public Nominatim/Photon APIs

### 3.3 Create App Compose File on Server

```bash
nano /docker/app/docker-compose.yml
```

Copy and paste the entire contents of `docker-compose.hostinger-app.yml` from this repository.

**What this does:** Defines how the app container should run.

---

## 🔄 Step 4: Automatic Deployment (Happens on Every Push)

Once set up, **every time you push code to the `main` branch**, GitHub Actions will:

1. ✅ **Build** the Next.js app image
2. ✅ **Transfer** it to your server
3. ✅ **Deploy** it using Docker Swarm
4. ✅ **Update** running containers (zero downtime)

**You don't need to do anything!** Just push your code.

---

## 📍 Directory Structure Summary

After setup, your server will have:

```
/docker/
├── services/              # Infrastructure project (Hostinger manages)
│   ├── docker-compose.yml    # Infrastructure compose file
│   └── .env                  # Infrastructure environment variables
│
└── app/                   # App project (GitHub Actions manages)
    ├── docker-compose.yml    # App compose file
    └── .env                  # App environment variables
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

### Check App Services:

```bash
# Check app service (if deployed)
docker service ls | grep app

# Check app logs
docker service logs adaptmap-app_app
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

# Check if Docker Swarm is active
docker info | grep Swarm
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

### Update Infrastructure

1. Edit `/docker/services/docker-compose.yml` in Hostinger's visual editor
2. Click **Deploy** or **Update**

### Update App

Just push to `main` branch - GitHub Actions handles it automatically!

### Manual App Update (if needed)

```bash
# On server
cd /docker/app
docker stack deploy -c docker-compose.yml adaptmap-app
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

- [ ] Docker Swarm initialized (`docker swarm init`)
- [ ] `traefik_data` volume created
- [ ] `/docker/services/` directory exists with `.env` and `docker-compose.yml`
- [ ] `/docker/app/` directory exists with `.env` and `docker-compose.yml`
- [ ] Infrastructure deployed via Hostinger dashboard
- [ ] All GitHub secrets and variables set
- [ ] DNS records point to your server (A record for `*.adaptmap.de`)
- [ ] Ports 80 and 443 are open in firewall

Once all checked, push to `main` and watch GitHub Actions deploy your app! 🚀
