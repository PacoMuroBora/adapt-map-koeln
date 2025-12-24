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

## GitHub Secrets Setup

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `DEPLOY_HOST`: Your server IP or domain (e.g., `123.45.67.89`)
- `DEPLOY_USER`: SSH username (e.g., `root` or `ubuntu`)
- `DEPLOY_SSH_KEY`: Your private SSH key (entire content including `-----BEGIN OPENSSH PRIVATE KEY-----`)
- `DEPLOY_PORT`: SSH port (optional, defaults to 22)

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

Make sure your server's `.env` file includes:
- `DOMAIN_NAME`
- `SSL_EMAIL`
- `DATABASE_URI` (MongoDB Atlas connection string)
- `PAYLOAD_SECRET`
- `NOMINATIM_PASSWORD`
- Other optional variables as needed

