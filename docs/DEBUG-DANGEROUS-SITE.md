# Debugging "Dangerous Site" Warning with Valid Certificate

When browsers show a "dangerous site" warning despite a valid SSL certificate, it's usually due to content security issues, not certificate problems.

## Quick Diagnostic Commands

### 1. Check Certificate Chain
```bash
# Test certificate chain completeness
openssl s_client -connect n8n.adaptmap.de:443 -showcerts

# Check certificate expiration
echo | openssl s_client -servername n8n.adaptmap.de -connect n8n.adaptmap.de:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate matches domain
echo | openssl s_client -servername n8n.adaptmap.de -connect n8n.adaptmap.de:443 2>/dev/null | openssl x509 -noout -text | grep -A 1 "Subject Alternative Name"
```

### 2. Check for Mixed Content
```bash
# Use browser DevTools Console (F12) and look for:
# - Mixed Content warnings
# - CSP violations
# - Insecure resource loads

# Or use curl to check response headers
curl -I https://n8n.adaptmap.de

# Check for HTTP resources in HTML
curl -s https://n8n.adaptmap.de | grep -i "http://" | grep -v "https://"
```

### 3. Check Safe Browsing Status
```bash
# Check Google Safe Browsing API (requires API key)
# Or use online tools:
# - https://transparencyreport.google.com/safe-browsing/search
# - https://www.virustotal.com

# Check via command line (if you have API key)
curl "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "client": {
      "clientId": "test",
      "clientVersion": "1.0"
    },
    "threatInfo": {
      "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING"],
      "platformTypes": ["ANY_PLATFORM"],
      "threatEntryTypes": ["URL"],
      "threatEntries": [{"url": "https://n8n.adaptmap.de"}]
    }
  }'
```

### 4. Check HSTS Preload Status
```bash
# Check if domain is in HSTS preload list
curl -I https://n8n.adaptmap.de | grep -i "strict-transport-security"

# Verify preload eligibility
# Visit: https://hstspreload.org/?domain=adaptmap.de
# Your config has STSPreload=true but domain must be submitted to preload list
```

### 5. Check Traefik Logs
```bash
# Check Traefik container logs for certificate issues
docker logs traefik --tail 100

# Check n8n container logs for errors
docker logs n8n --tail 100

# Check Traefik API for certificate status (access from container)
docker exec traefik wget -qO- http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("n8n"))'

# Or check certificate files directly
docker exec traefik ls -la /letsencrypt/acme.json
```

### 6. Test SSL Labs Rating
```bash
# Check SSL configuration rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=n8n.adaptmap.de
# Look for:
# - Certificate chain issues
# - Protocol support
# - Cipher suite strength
```

## Common Causes & Fixes

### Issue 1: Mixed Content (HTTP resources on HTTPS page)
**Symptoms:** Browser console shows mixed content warnings

**Fix:** Ensure all resources use HTTPS:
```yaml
# In docker-compose, ensure N8N_PROTOCOL=https
environment:
  - N8N_PROTOCOL=https
  - WEBHOOK_URL=https://n8n.${DOMAIN_NAME}/
```

**Check n8n workflows for hardcoded HTTP URLs**

### Issue 2: Safe Browsing Database Flag
**Symptoms:** Site flagged by Google Safe Browsing despite valid cert

**Fix:**
1. Check if domain was previously compromised
2. Request review: https://search.google.com/search-console
3. Check for malware/phishing patterns in content
4. Verify no suspicious redirects

### Issue 3: HSTS Preload Mismatch
**Symptoms:** STSPreload=true but domain not in preload list

**Fix:** Either:
- Remove preload (safer for subdomains):
```yaml
- traefik.http.middlewares.n8n.headers.STSPreload=false
```

- Or submit to preload list (only if you control entire domain):
  - Visit https://hstspreload.org
  - Submit adaptmap.de (not subdomain)
  - Wait for inclusion (can take weeks)

### Issue 4: Certificate Chain Issues
**Symptoms:** Some browsers show warnings, others don't

**Fix:** Ensure Traefik uses full chain:
```yaml
# Traefik should handle this automatically with Let's Encrypt
# But verify in logs:
docker logs traefik | grep -i "certificate"
```

### Issue 5: Content Security Policy Violations
**Symptoms:** CSP errors in browser console

**Fix:** Check n8n's CSP settings or add middleware:
```yaml
- traefik.http.middlewares.n8n.headers.ContentSecurityPolicy=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

### Issue 6: Redirect Loop
**Symptoms:** Browser can't load page, shows security warning

**Fix:** Check redirect configuration:
```yaml
# Current config has redirect middleware - verify it's working
# Test manually:
curl -L -I http://n8n.adaptmap.de
# Should redirect to HTTPS once, not loop
```

## Browser-Specific Debugging

### Chrome/Edge
1. Open DevTools (F12)
2. Go to Security tab
3. Check "Security Issues" section
4. Look for specific warnings

### Firefox
1. Open DevTools (F12)
2. Go to Network tab
3. Check for blocked resources
4. Look for mixed content warnings

### Safari
1. Enable Develop menu
2. Check Console for security warnings
3. Verify certificate in Keychain Access

## Immediate Actions

1. **Check browser console** - Most specific errors appear here
2. **Test in incognito/private mode** - Rules out extensions
3. **Test different browsers** - Identifies browser-specific issues
4. **Check Traefik logs** - Look for certificate or routing errors
5. **Verify DNS** - Ensure n8n.adaptmap.de resolves correctly

## Quick Fix: Disable HSTS Preload (Temporary)

If HSTS preload is causing issues:

```yaml
# In docker-compose.hostinger.yml, change line 77:
- traefik.http.middlewares.n8n.headers.STSPreload=false
```

Then restart:
```bash
docker-compose -f docker-compose.hostinger.yml up -d n8n traefik
```

## Verify Fix

After making changes:
```bash
# Test certificate
openssl s_client -connect n8n.adaptmap.de:443 -servername n8n.adaptmap.de

# Test HTTPS redirect
curl -I http://n8n.adaptmap.de

# Check headers
curl -I https://n8n.adaptmap.de | grep -i "strict-transport"
```
