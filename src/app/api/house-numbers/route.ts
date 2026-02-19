import { NextRequest, NextResponse } from 'next/server'
import { geocodeCache, createCacheKey } from '@/utilities/geocodeCache'

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter'

// Cologne bbox (south, west, north, east) for Overpass
const COLOGNE_BBOX = '50.85,6.75,51.05,7.15'

/** Escape string for use in Overpass regex (only .*+?^${}()|[\]\\ need escaping) */
function escapeOverpassRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface OverpassElement {
  type: 'node' | 'way'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
}

/**
 * GET /api/house-numbers?street=Moltkestraße&postcode=50674
 *
 * Returns addresses on a street in Cologne using Overpass API.
 * Use when Photon returns few/no house numbers (Photon mainly indexes POIs, not all buildings).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const street = searchParams.get('street')?.trim()
    const postcode = searchParams.get('postcode')?.trim()

    if (!street) {
      return NextResponse.json({ error: 'street is required' }, { status: 400 })
    }

    const cacheKey = createCacheKey('house-numbers', {
      street: street.toLowerCase().trim(),
      postcode: (postcode || '').trim(),
    })
    const cached = geocodeCache.get<{ addresses: Array<{ street: string; housenumber: string; postcode: string; city: string; lat: number; lng: number }> }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const escaped = escapeOverpassRegex(street)
    // Case-insensitive; also match ß/ss (e.g. Moltkestraße / Moltkestrasse)
    const withSs = escaped.replace(/ß/g, '(ß|ss)')
    const streetPattern = `^${withSs}$`

    // Query: nodes and ways with addr:street + addr:housenumber in Cologne bbox
    // out center gives us lat/lon for ways (building polygons)
    // Overpass regex: ~"pattern",i for case-insensitive
    const query = `
[out:json][timeout:15];
(
  node["addr:street"~"${streetPattern}",i]["addr:housenumber"](${COLOGNE_BBOX});
  way["addr:street"~"${streetPattern}",i]["addr:housenumber"](${COLOGNE_BBOX});
);
out center;
`.trim()

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(20000),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Overpass error:', response.status, text)
      return NextResponse.json(
        { error: 'Address search temporarily unavailable' },
        { status: 503 },
      )
    }

    const data: OverpassResponse = await response.json()
    const elements = data.elements || []

    const isCologne = (tags: Record<string, string> | undefined) => {
      const city = (tags?.['addr:city'] || '').toLowerCase()
      return city.includes('köln') || city.includes('cologne')
    }

    const results: Array<{
      street: string
      housenumber: string
      postcode: string
      city: string
      lat: number
      lng: number
    }> = []

    const seen = new Set<string>()

    for (const el of elements) {
      const tags = el.tags || {}
      if (!isCologne(tags)) continue

      const post = tags['addr:postcode'] || ''
      if (postcode && postcode.length === 5 && post !== postcode) continue

      const streetName = tags['addr:street'] || ''
      const houseNum = tags['addr:housenumber'] || ''
      if (!streetName || !houseNum) continue

      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (lat == null || lon == null) continue

      const key = `${streetName}|${houseNum}|${post}`
      if (seen.has(key)) continue
      seen.add(key)

      results.push({
        street: streetName,
        housenumber: houseNum,
        postcode: post,
        city: tags['addr:city'] || 'Köln',
        lat: Number(lat),
        lng: Number(lon),
      })
    }

    // Sort by house number (natural sort: 1, 2, 10, 11 instead of 1, 10, 11, 2)
    results.sort((a, b) => {
      const numA = parseInt(a.housenumber.replace(/\D/g, ''), 10) || 0
      const numB = parseInt(b.housenumber.replace(/\D/g, ''), 10) || 0
      if (numA !== numB) return numA - numB
      return a.housenumber.localeCompare(b.housenumber)
    })

    const responseData = { addresses: results }
    geocodeCache.set(cacheKey, responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('House numbers API error:', error)
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      return NextResponse.json(
        { error: 'Address search timed out. Please try again.' },
        { status: 504 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch house numbers' },
      { status: 500 },
    )
  }
}
