import { NextRequest, NextResponse } from 'next/server'
import { geocodeCache, createCacheKey } from '@/utilities/geocodeCache'

// Fallback to public service for development/prototyping
// Use regular env var (not NEXT_PUBLIC_) since this runs server-side
const GEOCODING_URL = process.env.GEOCODING_URL || 'https://nominatim.openstreetmap.org'

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    // Create cache key from coordinates (round to 4 decimal places for cache efficiency)
    // This groups nearby coordinates together, which is fine for postal code lookup
    const roundedLat = Number(lat).toFixed(4)
    const roundedLng = Number(lng).toFixed(4)
    const cacheKey = createCacheKey('reverse-geocode', {
      lat: roundedLat,
      lng: roundedLng,
    })

    // Check cache first
    const cached = geocodeCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Make request to reverse geocoding service
    const response = await fetch(
      `${GEOCODING_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AdaptMapKoeln/1.0', // Required by public Nominatim API
        },
      },
    )

    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }

    const data = await response.json()

    const result = {
      postal_code: data.address?.postcode || null,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      address: data.display_name,
    }

    // Cache the result (don't cache errors)
    geocodeCache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json({ error: 'Failed to reverse geocode location' }, { status: 500 })
  }
}
