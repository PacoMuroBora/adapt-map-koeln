# Debugging n8n Login Issues

## Quick Diagnostic Commands

```bash
# 1. Check n8n container logs for authentication errors
docker logs n8n --tail 100 | grep -i "auth\|login\|user\|error\|fail"

# 2. Check if n8n data volume exists and has data
docker volume inspect adaptmapkoeln_n8n_data

# 3. Check n8n database file (if using SQLite)
docker exec n8n ls -la /home/node/.n8n/database.sqlite 2>/dev/null || echo "No SQLite database found"

# 4. Check n8n version
docker exec n8n n8n --version

# 5. Check if container was recently recreated
docker inspect n8n | grep -i "created\|started"

# 6. Check environment variables affecting auth
docker exec n8n env | grep -i "n8n\|auth\|user"
```

## Common Causes & Fixes

### Issue 1: Volume Was Recreated/Reset
**Symptoms:** Login fails, no error message, or "user not found"

**Check:**
```bash
# Check volume creation time
docker volume inspect adaptmapkoeln_n8n_data | grep -i "created"

# Check if database file exists
docker exec n8n ls -la /home/node/.n8n/
```

**Fix:** If volume was recreated, you need to recreate your user account.

### Issue 2: Database Corruption
**Symptoms:** Login fails with database errors in logs

**Check:**
```bash
docker logs n8n 2>&1 | grep -i "database\|sqlite\|corrupt\|error"
```

**Fix:**
```bash
# Backup current data
docker exec n8n tar -czf /tmp/n8n-backup.tar.gz /home/node/.n8n/

# Try to repair (if SQLite)
docker exec n8n sqlite3 /home/node/.n8n/database.sqlite "PRAGMA integrity_check;"
```

### Issue 3: Container Recreated with Different Image
**Symptoms:** n8n version changed, authentication mechanism changed

**Check:**
```bash
# Check current image
docker inspect n8n | grep -i "image"

# Check n8n version
docker exec n8n n8n --version
```

**Fix:** If version changed significantly, you may need to:
- Recreate user account
- Or restore from backup

### Issue 4: Environment Variable Changes
**Symptoms:** Auth works but certain features don't

**Check:**
```bash
docker exec n8n env | grep N8N
```

**Fix:** Ensure these are set correctly:
- `N8N_HOST` - Must match your domain
- `N8N_PROTOCOL` - Should be `https`
- `WEBHOOK_URL` - Should be full HTTPS URL

### Issue 5: Session/Cookie Issues
**Symptoms:** Login works but immediately logs out, or can't stay logged in

**Fix:**
- Clear browser cookies for `n8n.adaptmap.de`
- Try incognito/private mode
- Check if HSTS or security headers are interfering

## Solutions

### Solution 1: Reset n8n User (If Volume Was Reset)

If the volume was recreated, you need to create a new owner account:

```bash
# Stop n8n
docker-compose -f docker-compose.hostinger.yml stop n8n

# Access n8n container
docker exec -it n8n sh

# Inside container, run n8n user management
n8n user:reset --email=your-email@example.com

# Or use n8n CLI to create new user
n8n user:create --email=your-email@example.com --firstName=Admin --lastName=User --password=your-password
```

**Note:** n8n CLI commands may vary by version. Check n8n docs for your version.

### Solution 2: Restore from Backup

If you have a backup:

```bash
# Stop n8n
docker-compose -f docker-compose.hostinger.yml stop n8n

# Restore backup
docker run --rm -v adaptmapkoeln_n8n_data:/data -v /path/to/backup:/backup alpine tar -xzf /backup/n8n-backup.tar.gz -C /data

# Start n8n
docker-compose -f docker-compose.hostinger.yml start n8n
```

### Solution 3: Check n8n First-Time Setup

If n8n thinks it's a fresh install:

```bash
# Check if owner exists
docker exec n8n ls -la /home/node/.n8n/config

# Check n8n logs for setup prompts
docker logs n8n | grep -i "owner\|setup\|first"
```

If it's asking for first-time setup, you may need to:
1. Access n8n via browser
2. Complete the initial setup
3. Create your admin account

### Solution 4: Verify Volume Mount

```bash
# Check if volume is mounted correctly
docker inspect n8n | grep -A 10 "Mounts"

# Check if data directory exists and is writable
docker exec n8n ls -la /home/node/.n8n/
docker exec n8n touch /home/node/.n8n/test && docker exec n8n rm /home/node/.n8n/test
```

## Prevention

1. **Backup n8n data regularly:**
```bash
docker exec n8n tar -czf /tmp/n8n-backup-$(date +%Y%m%d).tar.gz /home/node/.n8n/
docker cp n8n:/tmp/n8n-backup-*.tar.gz ./backups/
```

2. **Pin n8n version in docker-compose:**
```yaml
image: docker.n8n.io/n8nio/n8n:2.1.4  # Pin to specific version
```

3. **Use external database** (PostgreSQL/MySQL) instead of SQLite for production

## Quick Recovery Steps

1. **Check logs first:**
```bash
docker logs n8n --tail 200
```

2. **Verify volume:**
```bash
docker volume ls | grep n8n
docker volume inspect adaptmapkoeln_n8n_data
```

3. **Check if it's a fresh install:**
```bash
docker exec n8n ls -la /home/node/.n8n/
# If empty or missing, volume was reset
```

4. **If volume was reset:**
   - You'll need to recreate your account
   - Or restore from backup if available
   - Re-import workflows if needed

5. **If data exists but login fails:**
   - Check for database corruption
   - Try password reset
   - Check browser console for errors
