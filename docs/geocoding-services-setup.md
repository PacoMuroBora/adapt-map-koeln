# Geocoding Services Setup Guide for Hostinger VPS

**A beginner-friendly guide to setting up self-hosted geocoding services**

**💡 Have Hostinger Dashboard YAML Editor?** If you've already set up n8n, Traefik, Redis via the Hostinger dashboard, check out the **much easier method**: [`docs/HOSTINGER-DASHBOARD-SETUP.md`](HOSTINGER-DASHBOARD-SETUP.md)

## 📋 What is This?

This guide helps you set up two services on your Hostinger VPS (Virtual Private Server):

1. **Nominatim** - Converts GPS coordinates (like `50.9375, 6.9603`) into addresses and postal codes
2. **Photon** - Converts addresses (like "Köln") into GPS coordinates

These services are needed for the AdaptMap Köln app to work with location data. We're hosting them ourselves instead of using public APIs because:
- ✅ No rate limits (public services limit you to 1 request per second)
- ✅ More reliable (no dependency on external services)
- ✅ Faster (data is stored locally)
- ✅ Free and open-source

## 🎯 What You'll Need

Before starting, make sure you have:

- ✅ A Hostinger VPS (Virtual Private Server) with root or sudo access
- ✅ SSH access to your VPS (you can connect via terminal/command line)
- ✅ A domain or subdomain (e.g., `geocoding.yourdomain.com`) - optional but recommended
- ✅ Basic command line knowledge (we'll guide you through everything)

**Recommended VPS specs:**
- **Minimum**: 4GB RAM, 20GB disk space, 2 CPU cores (~€5-10/month)
- **Recommended**: 8GB RAM, 50GB disk space, 4 CPU cores (~€15-20/month)

---

## 🚀 Step-by-Step Setup

### Step 1: Connect to Your Hostinger VPS

**What this does:** Opens a connection to your server so you can run commands.

1. Open your terminal/command prompt (on Windows: PowerShell or Git Bash)
2. Connect via SSH:
   ```bash
   ssh root@your-vps-ip-address
   # Or if you have a username:
   ssh username@your-vps-ip-address
   ```
3. Enter your password when prompted

**💡 Tip:** If you're using Windows, you can use PuTTY or the built-in SSH client.

---

### Step 2: Install Docker and Docker Compose

**What this does:** Docker is like a container system that packages software with everything it needs to run. Docker Compose helps manage multiple containers together.

**Why we need it:** Our geocoding services run in Docker containers, which makes setup and management much easier.

#### Option A: Use the Automated Script (Easiest)

```bash
# Download the setup script
cd ~
wget https://raw.githubusercontent.com/your-repo/AdaptMapKoeln/main/scripts/setup-geocoding-hostinger.sh

# Make it executable
chmod +x setup-geocoding-hostinger.sh

# Run it
./setup-geocoding-hostinger.sh
```

The script will:
- Check if Docker is installed
- Install Docker if needed
- Install Docker Compose if needed
- Guide you through the rest

#### Option B: Manual Installation

If you prefer to do it manually:

```bash
# Update your system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation (should show version numbers)
docker --version
docker-compose --version

# Add your user to docker group (so you don't need sudo for docker commands)
sudo usermod -aG docker $USER
```

**⚠️ Important:** After adding yourself to the docker group, you need to log out and log back in for it to take effect.

**✅ Check:** Run `docker ps` - if it shows a list (even if empty), Docker is working!

---

### Step 3: Upload the Docker Compose File

**What this does:** Gets the configuration file that tells Docker how to run our services.

**Option A: Using Git (Recommended)**

```bash
# Navigate to your home directory
cd ~

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/your-username/AdaptMapKoeln.git

# Navigate to the project
cd AdaptMapKoeln

# Copy the docker-compose file to a dedicated directory
mkdir -p ~/geocoding-services
cp docker-compose.geocoding.yml ~/geocoding-services/
cd ~/geocoding-services
```

**Option B: Using SCP (from your local machine)**

On your local computer (not the VPS):

```bash
# Replace 'user' and 'your-vps-ip' with your actual details
scp docker-compose.geocoding.yml user@your-vps-ip:~/geocoding-services/
```

**Option C: Manual Upload**

1. Create the directory on your VPS:
   ```bash
   mkdir -p ~/geocoding-services
   cd ~/geocoding-services
   ```

2. Create the file:
   ```bash
   nano docker-compose.geocoding.yml
   ```

3. Copy and paste the contents from `docker-compose.geocoding.yml` in this repository
4. Save: Press `Ctrl+X`, then `Y`, then `Enter`

**✅ Check:** Run `ls -la docker-compose.geocoding.yml` - you should see the file listed.

---

### Step 4: Create Environment File

**What this does:** Creates a file with your password for the database. This keeps sensitive information separate from the main config.

```bash
# Make sure you're in the right directory
cd ~/geocoding-services

# Create the .env file
nano .env
```

Add this content (replace `your_secure_password_here` with a strong password):

```env
NOMINATIM_PASSWORD=your_secure_password_here
```

**💡 Password Tips:**
- Use at least 16 characters
- Mix letters, numbers, and symbols
- Don't use this password anywhere else
- Save it somewhere safe (password manager)

Save the file: Press `Ctrl+X`, then `Y`, then `Enter`.

**✅ Check:** Run `cat .env` - you should see your password (be careful, it will be visible!).

---

### Step 5: Choose Your Region (Important!)

**What this does:** Decides which geographic area's data to download. Smaller regions = faster setup.

**Option A: Just Cologne/NRW (Fastest - Recommended for Testing)**

Edit the docker-compose file:
```bash
nano docker-compose.geocoding.yml
```

Find this line:
```yaml
- PBF_URL=https://download.geofabrik.de/europe/germany-latest.osm.pbf
```

Change it to:
```yaml
- PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
```

**Benefits:**
- ✅ Faster import (1-2 hours instead of 4-8 hours)
- ✅ Less disk space needed (~10GB instead of ~30GB)
- ✅ Less RAM needed (4GB instead of 8GB)
- ✅ Perfect for Cologne/Köln area

**Option B: All of Germany (More Complete)**

Keep the default setting. This will:
- Take 4-8 hours to import
- Need ~30GB disk space
- Need 8GB+ RAM
- Cover all of Germany

**💡 Recommendation:** Start with Option A (NRW only) to test. You can always switch to full Germany later.

---

### Step 6: Start the Services (The Big One!)

**What this does:** Downloads OpenStreetMap data and sets up the geocoding services. This is the longest step.

```bash
# Make sure you're in the right directory
cd ~/geocoding-services

# Start the services (the -d flag runs them in the background)
docker-compose -f docker-compose.geocoding.yml up -d
```

**What happens next:**
1. Docker downloads the container images (5-10 minutes)
2. Nominatim downloads the OSM data file (depends on your internet speed)
3. Nominatim imports the data into a database (1-8 hours depending on region)
4. Photon starts indexing (30 minutes - 1 hour)

**⏱️ Timeline:**
- NRW region: 1-2 hours total
- All of Germany: 4-8 hours total

**📊 Monitor Progress:**

Open a new terminal/SSH session and run:
```bash
# Watch the logs in real-time
docker-compose -f docker-compose.geocoding.yml logs -f nominatim
```

**What to look for:**
- ✅ "Downloading..." - Data is being downloaded
- ✅ "Importing..." - Data is being imported
- ✅ "Nominatim is ready" or "ready to accept requests" - **Success!**

**💡 Tip:** You can close the terminal - the services will keep running in the background. Check back in a few hours.

**✅ Check if it's working:**
```bash
# Check container status
docker-compose -f docker-compose.geocoding.yml ps

# You should see both "nominatim" and "photon" with status "Up"
```

---

### Step 7: Test the Services

**What this does:** Verifies that everything is working correctly.

**Test Nominatim (Reverse Geocoding):**
```bash
# Test with Cologne coordinates
curl "http://localhost:8080/reverse?format=json&lat=50.9375&lon=6.9603"
```

**Expected response:** You should see JSON with address information including postal code and city.

**Test Photon (Forward Geocoding):**
```bash
# Test with a search query
curl "http://localhost:2322/api?q=Köln&limit=5"
```

**Expected response:** You should see JSON with coordinates and location data.

**✅ If both tests work:** Congratulations! Your services are running! 🎉

---

### Step 8: Configure Firewall (Security)

**What this does:** Opens the necessary ports so your Next.js app can access the services.

```bash
# Check if UFW (firewall) is installed
sudo ufw --version

# If not installed, install it
sudo apt install ufw -y

# Allow SSH (important - don't skip this!)
sudo ufw allow 22/tcp

# Allow Nominatim
sudo ufw allow 8080/tcp

# Allow Photon
sudo ufw allow 2322/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**✅ Check:** You should see rules for ports 22, 8080, and 2322.

---

### Step 9: Set Up Reverse Proxy with SSL (Production - Recommended)

**What this does:** 
- Makes services accessible via HTTPS (secure)
- Allows you to use a domain name instead of IP address
- Adds security and professional setup

**Why we need it:** 
- Your Next.js app needs to call these services over HTTPS
- SSL certificates provide encryption
- Domain names are easier to manage than IP addresses

#### 9.1: Install Nginx and Certbot

```bash
# Install Nginx (web server that will act as reverse proxy)
sudo apt install nginx -y

# Install Certbot (for free SSL certificates from Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y

# Check Nginx is running
sudo systemctl status nginx
```

#### 9.2: Point Your Domain to Your VPS

**Before continuing:** Make sure your domain (e.g., `geocoding.yourdomain.com`) points to your VPS IP address.

**How to check:**
```bash
# On your local machine
ping geocoding.yourdomain.com
# Should show your VPS IP address
```

#### 9.3: Create Nginx Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/geocoding
```

Paste this configuration (replace `geocoding.yourdomain.com` with your actual domain):

```nginx
# Nominatim reverse proxy
server {
    listen 80;
    server_name geocoding.yourdomain.com;

    # Nominatim endpoint
    location /nominatim/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
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
    }
}
```

Save: `Ctrl+X`, then `Y`, then `Enter`.

#### 9.4: Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/geocoding /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

#### 9.5: Get SSL Certificate

```bash
# Get free SSL certificate (replace with your domain)
sudo certbot --nginx -d geocoding.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

**✅ Check:** Visit `https://geocoding.yourdomain.com/nominatim/status` in your browser - you should see a status response!

---

### Step 10: Update Your Next.js App Environment Variables

**What this does:** Tells your Next.js app where to find the geocoding services.

#### For Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com/nominatim
NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com/photon
```

4. Select **Production** (and optionally **Preview** and **Development**)
5. Click **Save**
6. Redeploy your app

#### For Fly.io:

```bash
# Set environment variables
fly secrets set NEXT_PUBLIC_GEOCODING_URL=https://geocoding.yourdomain.com/nominatim
fly secrets set NEXT_PUBLIC_PHOTON_URL=https://geocoding.yourdomain.com/photon

# Restart your app
fly apps restart your-app-name
```

---

## 🎉 You're Done!

Your geocoding services are now running! Here's what you've accomplished:

✅ Self-hosted Nominatim (reverse geocoding)  
✅ Self-hosted Photon (forward geocoding)  
✅ Secure HTTPS access via domain  
✅ Ready for production use  

---

## 📚 Useful Commands Reference

### Check Service Status
```bash
docker-compose -f docker-compose.geocoding.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.geocoding.yml logs -f

# Just Nominatim
docker-compose -f docker-compose.geocoding.yml logs -f nominatim

# Just Photon
docker-compose -f docker-compose.geocoding.yml logs -f photon
```

### Restart Services
```bash
docker-compose -f docker-compose.geocoding.yml restart
```

### Stop Services
```bash
docker-compose -f docker-compose.geocoding.yml stop
```

### Start Services
```bash
docker-compose -f docker-compose.geocoding.yml up -d
```

### Check Resource Usage
```bash
docker stats nominatim photon
```

---

## 🔧 Troubleshooting

### Problem: Services won't start

**Check logs:**
```bash
docker-compose -f docker-compose.geocoding.yml logs
```

**Common issues:**
- **Out of disk space:** `df -h` - need at least 20GB free
- **Out of memory:** `free -h` - need at least 4GB RAM
- **Ports already in use:** `sudo netstat -tulpn | grep -E '8080|2322'`

### Problem: Import taking forever

**This is normal!** Initial import can take:
- NRW region: 1-2 hours
- All Germany: 4-8 hours

**Check if it's actually working:**
```bash
docker-compose -f docker-compose.geocoding.yml logs -f nominatim
```

Look for progress messages. If you see errors, check the troubleshooting section below.

### Problem: "Connection refused" when testing

**Check services are running:**
```bash
docker-compose -f docker-compose.geocoding.yml ps
```

**Check firewall:**
```bash
sudo ufw status
```

**Test locally first:**
```bash
curl http://localhost:8080/status
```

### Problem: Out of memory errors

**Solution 1:** Use a smaller region (edit `docker-compose.geocoding.yml`):
```yaml
- PBF_URL=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf
```

**Solution 2:** Reduce memory limits in `docker-compose.geocoding.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Reduce from 6G
```

**Solution 3:** Upgrade your VPS to more RAM

### Problem: SSL certificate won't generate

**Check domain points to VPS:**
```bash
# On your local machine
nslookup geocoding.yourdomain.com
```

**Check Nginx is running:**
```bash
sudo systemctl status nginx
```

**Check firewall allows port 80:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 🔄 Keeping Data Updated

OSM data changes regularly. To keep your data fresh:

```bash
# Set up weekly updates (runs every Sunday at 2 AM)
crontab -e

# Add this line:
0 2 * * 0 cd ~/geocoding-services && docker-compose -f docker-compose.geocoding.yml exec nominatim nominatim replication --once
```

---

## 💾 Backup Your Data

**Backup Nominatim database:**
```bash
docker exec nominatim pg_dump -U nominatim nominatim > backup_$(date +%Y%m%d).sql
```

**Restore from backup:**
```bash
# Stop services first
docker-compose -f docker-compose.geocoding.yml stop

# Restore (this is more complex - see Docker volume backup docs)
```

---

## 📊 Resource Requirements Summary

| Region | RAM | Disk | CPU | Import Time | Cost/Month |
|--------|-----|------|-----|-------------|------------|
| NRW only | 4GB | 20GB | 2 cores | 1-2 hours | €5-10 |
| All Germany | 8GB | 50GB | 4 cores | 4-8 hours | €15-20 |
| Optimal | 16GB | 100GB | 4+ cores | 2-4 hours | €30-40 |

---

## 🆘 Need Help?

1. **Check the logs:** `docker-compose -f docker-compose.geocoding.yml logs`
2. **Check service status:** `docker-compose -f docker-compose.geocoding.yml ps`
3. **Check resources:** `docker stats` and `df -h` and `free -h`
4. **Review this guide** - most common issues are covered above

---

## ✅ Setup Checklist

- [ ] Connected to VPS via SSH
- [ ] Installed Docker and Docker Compose
- [ ] Uploaded `docker-compose.geocoding.yml`
- [ ] Created `.env` file with secure password
- [ ] Chosen region (NRW or all Germany)
- [ ] Started services and waited for import
- [ ] Tested services locally
- [ ] Configured firewall
- [ ] Set up Nginx reverse proxy
- [ ] Obtained SSL certificate
- [ ] Updated Next.js environment variables
- [ ] Tested from Next.js app

---

**🎊 Congratulations!** You've successfully set up production-ready geocoding services!
