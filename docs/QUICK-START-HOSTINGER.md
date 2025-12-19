# 🚀 Quick Start Guide - Hostinger VPS Setup

**5-Minute Overview - Full details in `geocoding-services-setup.md`**

**💡 Have Hostinger Dashboard YAML Editor?** If you've set up n8n, Traefik, Redis via the dashboard, see: [`docs/HOSTINGER-DASHBOARD-SETUP.md`](HOSTINGER-DASHBOARD-SETUP.md) for the easiest setup method!

## Prerequisites Checklist

- [ ] Hostinger VPS with at least 4GB RAM, 20GB disk
- [ ] SSH access to your VPS
- [ ] Domain/subdomain (optional but recommended)

---

## The 5 Essential Steps

### 1️⃣ Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 2️⃣ Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3️⃣ Set Up Files
```bash
mkdir -p ~/geocoding-services
cd ~/geocoding-services
# Upload docker-compose.geocoding.yml here
# Options:
#   - Hostinger File Manager (if available in your plan)
#   - SFTP client (FileZilla, WinSCP)
#   - Git clone
#   - SCP from command line
# See docs/HOSTINGER-FILE-UPLOAD.md for details
nano .env  # Add: NOMINATIM_PASSWORD=your_secure_password
```

### 4️⃣ Start Services
```bash
docker-compose -f docker-compose.geocoding.yml up -d
docker-compose -f docker-compose.geocoding.yml logs -f nominatim
# Wait 1-8 hours for initial import (watch the logs)
```

### 5️⃣ Test It Works
```bash
curl "http://localhost:8080/reverse?format=json&lat=50.9375&lon=6.9603"
# Should return JSON with address data
```

---

## ⚙️ Optional: Add HTTPS (Recommended for Production)

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config (see full guide for details)
sudo nano /etc/nginx/sites-available/geocoding

# Enable site
sudo ln -s /etc/nginx/sites-available/geocoding /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d geocoding.yourdomain.com
```

---

## 📝 Common Commands

```bash
# Check status
docker-compose -f docker-compose.geocoding.yml ps

# View logs
docker-compose -f docker-compose.geocoding.yml logs -f

# Restart services
docker-compose -f docker-compose.geocoding.yml restart

# Stop services
docker-compose -f docker-compose.geocoding.yml stop
```

---

## ⚠️ Important Notes

1. **Initial import takes 1-8 hours** - This is normal! Be patient.
2. **Use NRW region for testing** - Edit `docker-compose.geocoding.yml` to use NRW instead of all Germany (faster)
3. **Save your password** - The `.env` file password is important, keep it safe
4. **Check resources** - Make sure you have enough RAM and disk space

---

## 🆘 Quick Troubleshooting

**Services won't start?**
```bash
docker-compose -f docker-compose.geocoding.yml logs
df -h  # Check disk space
free -h  # Check RAM
```

**Import taking forever?**
- This is normal! Check logs to see progress
- NRW region: 1-2 hours
- All Germany: 4-8 hours

**Can't connect?**
```bash
sudo ufw allow 8080/tcp  # Allow Nominatim
sudo ufw allow 2322/tcp  # Allow Photon
```

---

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced configuration, see:
**`docs/geocoding-services-setup.md`**

---

**Need help?** Check the logs first: `docker-compose -f docker-compose.geocoding.yml logs`

