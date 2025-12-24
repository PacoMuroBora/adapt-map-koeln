# Deployment Guide

This guide explains how to deploy the application to your Hostinger VPS using GitHub Actions.

## Prerequisites

1. **Docker Swarm initialized on server**
   ```bash
   ssh user@your-server
   docker swarm init
   ```

2. **Project directory on server**
   ```bash
   mkdir -p /opt/adaptmap
   # Copy docker-compose.yml to /opt/adaptmap/
   ```

3. **Create Traefik volume**
   ```bash
   docker volume create traefik_data
   ```

4. **SSH key for GitHub Actions**
   - Generate a new SSH key pair (or use existing)
   - Add public key to server: `~/.ssh/authorized_keys`
   - Keep private key for GitHub secrets

## GitHub Secrets and Variables Setup

Go to your GitHub repository → Settings → Secrets and variables → Actions:

### Variables (non-sensitive configuration):
- `DOMAIN_NAME`: Your domain name without protocol (e.g., `example.com` - **REQUIRED for build**)
- `DEPLOY_HOST`: Your server IP or domain (e.g., `123.45.67.89`)
- `DEPLOY_USER`: SSH username (e.g., `root` or `ubuntu`)
- `DEPLOY_PORT`: SSH port (optional, defaults to 22)

### Secrets (sensitive data):
- `DATABASE_URI`: MongoDB Atlas connection string (**REQUIRED for build** - Payload needs DB access during build for `generateStaticParams`)
- `PAYLOAD_SECRET`: Payload CMS secret key (**REQUIRED for build**)
- `DEPLOY_SSH_KEY`: Your private SSH key (**REQUIRED** - must include full key with headers):
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  [key content here]
  -----END OPENSSH PRIVATE KEY-----
  ```
  
  **Important:** Copy the entire key including the BEGIN/END lines. No extra whitespace at start/end.

**Required for build (Next.js needs these at build time):**
- `DOMAIN_NAME`: Your domain name (e.g., `example.com`) - used for `NEXT_PUBLIC_*` variables

**Optional (if you want to build with these vars instead of runtime-only):**
- `DATABASE_URI`: MongoDB connection string (can be runtime-only on server)
- `PAYLOAD_SECRET`: Payload secret (can be runtime-only on server)

## Initial Server Setup

1. **Copy docker-compose.yml to server:**
   ```bash
   scp docker-compose.yml user@your-server:/opt/adaptmap/
   ```

2. **Create .env file on server:**
   ```bash
   ssh user@your-server
   cd /opt/adaptmap
   nano .env
   ```
   
   Add all required environment variables (see docker-compose.yml comments)

3. **Initial deployment:**
   ```bash
   cd /opt/adaptmap
   docker stack deploy -c docker-compose.yml adaptmap
   ```

## Deployment Process

The GitHub Actions workflow will:

1. **Build** the Docker image on GitHub runner
2. **Save** image as compressed tar file
3. **Transfer** to server via SCP
4. **Load** image on server
5. **Update** Docker stack (rolling update with 3 replicas)
6. **Verify** deployment status

## Manual Deployment

If you need to deploy manually:

```bash
# On your local machine
docker build -t adaptmap-app:latest .
docker save adaptmap-app:latest | gzip > image.tar.gz

# Transfer to server
scp image.tar.gz user@your-server:/tmp/

# On server
ssh user@your-server
gunzip -c /tmp/image.tar.gz | docker load
cd /opt/adaptmap
docker stack deploy -c docker-compose.yml adaptmap
docker image prune -f
```

## Monitoring Deployments

**Check service status:**
```bash
docker service ls
docker service ps adaptmap_app
docker service logs -f adaptmap_app
```

**Rollback if needed:**
```bash
docker service rollback adaptmap_app
```

## Troubleshooting

**Service not updating:**
- Check if Docker Swarm is active: `docker info | grep Swarm`
- Verify image was loaded: `docker images | grep adaptmap-app`
- Check service logs: `docker service logs adaptmap_app`

**SSH connection issues:**
- Verify SSH key is correct in GitHub secrets
- Test SSH connection manually: `ssh -i ~/.ssh/your_key user@your-server`
- Check server firewall allows SSH

**Build failures:**
- Check GitHub Actions logs
- Verify Dockerfile is correct
- Ensure all dependencies are in package.json

## Environment Variables

**On Hostinger server** (`.env` file in `/opt/adaptmap/`):
- `DOMAIN_NAME` - Your domain name
- `SSL_EMAIL` - For Let's Encrypt certificates
- `DATABASE_URI` - MongoDB Atlas connection string
- `PAYLOAD_SECRET` - Payload CMS secret
- `NOMINATIM_PASSWORD` - Database password for Nominatim
- `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` - Optional email settings
- `CRON_SECRET`, `SESSION_LOG_SECRET` - Optional secrets

**In GitHub Secrets** (for build-time):
- `DOMAIN_NAME` - Required for `NEXT_PUBLIC_*` variables (embedded in client bundle)

**Note:** `NEXT_PUBLIC_*` variables MUST be available at build time. They're embedded in the JavaScript bundle that runs in the browser. Other variables can be runtime-only on the server.

