import { NextRequest, NextResponse } from 'next/server'
import { geocodeCache, createCacheKey } from '@/utilities/geocodeCache'

// Fallback to public service for development/prototyping
// Use regular env var (not NEXT_PUBLIC_) since this runs server-side
const PHOTON_URL = process.env.PHOTON_URL || 'https://photon.komoot.io'

export async function POST(req: NextRequest) {
  try {
    const { street, housenumber, postalcode, city } = await req.json()

    // Build query
    const queryParts = []
    if (street) queryParts.push(street)
    if (housenumber) queryParts.push(housenumber)
    if (postalcode) queryParts.push(postalcode)
    if (city) queryParts.push(city)

    const query = queryParts.join(' ')

    // Create cache key from normalized address components
    const cacheKey = createCacheKey('geocode', {
      street: street?.toLowerCase().trim() || '',
      housenumber: housenumber?.toLowerCase().trim() || '',
      postalcode: postalcode?.trim() || '',
      city: city?.toLowerCase().trim() || '',
    })

    // Check cache first
    const cached = geocodeCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Make request to geocoding service
    const response = await fetch(
      `${PHOTON_URL}/api?q=${encodeURIComponent(query)}&limit=1&lang=de`,
      {
        headers: {
          'User-Agent': 'AdaptMapKoeln/1.0',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const feature = data.features[0]
    const [lng, lat] = feature.geometry.coordinates

    const result = {
      lat,
      lng,
      postal_code: feature.properties.postcode || postalcode || null,
      city: feature.properties.city || feature.properties.town || city || null,
      address: feature.properties.name || query,
    }

    // Cache the result (don't cache errors)
    geocodeCache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 })
  }
}
