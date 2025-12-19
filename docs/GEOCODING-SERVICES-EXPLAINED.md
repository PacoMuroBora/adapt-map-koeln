# Geocoding Services Explained

**A simple explanation of what Nominatim and Photon do and why we need them**

---

## What is Geocoding?

**Geocoding** is the process of converting between:
- **Addresses** (like "Köln, Germany") ↔ **Coordinates** (like `50.9375, 6.9603`)
- **Coordinates** (GPS location) ↔ **Addresses** (postal code, city, street)

Think of it as a translator between human-readable addresses and computer-readable coordinates.

---

## The Two Services We Use

### 1. Nominatim (Reverse Geocoding)

**What it does:**
- Takes GPS coordinates (latitude, longitude) 
- Returns address information (postal code, city, street)

**Example:**
```
Input:  lat=50.9375, lon=6.9603
Output: {
  postal_code: "50667",
  city: "Cologne",
  address: "Cologne, North Rhine-Westphalia, Germany"
}
```

**Why we need it:**
- Users submit their location via GPS (from their phone)
- We need to convert those coordinates to a postal code for the heatmap
- The heatmap groups submissions by postal code, not coordinates

**When we use it:**
- User allows GPS access → we get coordinates → we call Nominatim → we get postal code
- See: `src/app/api/reverse-geocode/route.ts`

---

### 2. Photon (Forward Geocoding)

**What it does:**
- Takes an address or place name
- Returns GPS coordinates

**Example:**
```
Input:  "Köln, Germany"
Output: {
  lat: 50.9375,
  lng: 6.9603,
  postal_code: "50667",
  city: "Cologne"
}
```

**Why we need it:**
- Users can manually enter an address instead of using GPS
- We need to convert that address to coordinates
- Coordinates are needed for the heatmap visualization

**When we use it:**
- User types "Köln" → we call Photon → we get coordinates → we can show on map
- See: `src/app/api/geocode/route.ts`

---

## Why We Self-Host (Instead of Using Public APIs)

### Public Services Have Limits

**Public Nominatim:**
- ❌ Rate limit: **1 request per second** (very slow!)
- ❌ Can't handle many users at once
- ❌ May go down or be unavailable
- ❌ Privacy concerns (your data goes to third party)

**Our Self-Hosted Services:**
- ✅ **No rate limits** (as fast as your server can handle)
- ✅ **Reliable** (we control it)
- ✅ **Private** (data stays on our server)
- ✅ **Free** (open-source, just server costs)

---

## How We Use Them in the App

### User Journey Example

1. **User opens the app** → Goes to location capture page
2. **Option A: GPS Location**
   - User clicks "Use GPS" → Browser gets coordinates
   - App calls `/api/reverse-geocode` → Uses Nominatim
   - Gets postal code → Stores in submission

3. **Option B: Manual Address**
   - User types "Köln" → App calls `/api/geocode` → Uses Photon
   - Gets coordinates → App can show on map
   - User confirms → App calls `/api/reverse-geocode` → Gets postal code

4. **Submission Created**
   - Location data (coordinates + postal code) saved
   - Used for heatmap visualization

### Code Flow

```
Frontend (Location Page)
  ↓
  User provides GPS or address
  ↓
Next.js API Route (/api/geocode or /api/reverse-geocode)
  ↓
Calls self-hosted Nominatim/Photon (on Hostinger VPS)
  ↓
Returns postal code + coordinates
  ↓
Stored in Payload CMS Submission
  ↓
Used for heatmap visualization
```

---

## Technical Details

### Nominatim (Reverse Geocoding)

**Endpoint:** `https://geocoding.yourdomain.com/reverse`

**Request:**
```
GET /reverse?format=json&lat=50.9375&lon=6.9603
```

**Response:**
```json
{
  "address": {
    "postcode": "50667",
    "city": "Cologne",
    "country": "Germany"
  },
  "display_name": "Cologne, North Rhine-Westphalia, Germany"
}
```

**Used in:** `src/app/api/reverse-geocode/route.ts`

---

### Photon (Forward Geocoding)

**Endpoint:** `https://geocoding.yourdomain.com/api`

**Request:**
```
GET /api?q=Köln&limit=1&lang=de
```

**Response:**
```json
{
  "features": [{
    "geometry": {
      "coordinates": [6.9603, 50.9375]  // [lng, lat]
    },
    "properties": {
      "name": "Köln",
      "postcode": "50667",
      "city": "Köln"
    }
  }]
}
```

**Used in:** `src/app/api/geocode/route.ts`

---

## Data Source

Both services use **OpenStreetMap (OSM)** data:
- Free, open-source map data
- Updated by volunteers worldwide
- Very detailed for Germany (especially cities like Cologne)
- We download and host the data ourselves

**Data Updates:**
- Initial import: 1-8 hours (one-time setup)
- Regular updates: Weekly (automatic via cron job)
- Keeps data fresh and accurate

---

## Summary

| Service | Input | Output | When Used |
|---------|-------|--------|-----------|
| **Nominatim** | GPS coordinates | Postal code, city, address | User allows GPS → need postal code |
| **Photon** | Address/place name | GPS coordinates | User types address → need coordinates |

**Why self-host?**
- No rate limits
- Better performance
- More reliable
- Privacy (data stays on our server)

**How we use them:**
- Convert between addresses and coordinates
- Get postal codes for heatmap grouping
- Enable both GPS and manual address input
- Power the location capture feature

---

**For setup instructions:** See `docs/HOSTINGER-DASHBOARD-SETUP.md`

