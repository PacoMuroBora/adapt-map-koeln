import { NextRequest, NextResponse } from 'next/server'
import { geocodeCache, createCacheKey } from '@/utilities/geocodeCache'

// Forward geocoding service configuration with fallback chain:
// 1. LocationIQ (if API key provided) - European, 5,000 req/day free, Nominatim-based
// 2. Custom PHOTON_URL (if set)
// 3. Public Photon (fallback)
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY
const LOCATIONIQ_BASE_URL = process.env.LOCATIONIQ_BASE_URL || 'https://eu1.locationiq.com/v1'
const PHOTON_URL = process.env.PHOTON_URL || 'https://photon.komoot.io'

// Determine which service to use
const useLocationIQ = Boolean(LOCATIONIQ_API_KEY)

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const RATE_LIMIT_DELAY = 2000 // 2 seconds for rate-limited public services

/**
 * Retry fetch with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If rate limited (429), wait longer before retry
      if (response.status === 429) {
        if (attempt < retries) {
          const delay = RATE_LIMIT_DELAY * (attempt + 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      }

      // If successful or non-retryable error, return response
      if (response.ok || (response.status !== 429 && response.status !== 503)) {
        return response
      }

      // For other retryable errors (503), use exponential backoff
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (error) {
      // Network errors: retry with exponential backoff
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }

  throw new Error('Max retries exceeded')
}

export async function POST(req: NextRequest) {
  try {
    const { street, housenumber, postalcode, city } = await req.json()

    // Validate required fields
    if (!postalcode && !city) {
      return NextResponse.json({ error: 'Postal code or city is required' }, { status: 400 })
    }

    // Build query
    const queryParts = []
    if (street) queryParts.push(street)
    if (housenumber) queryParts.push(housenumber)
    if (postalcode) queryParts.push(postalcode)
    if (city) queryParts.push(city)

    const query = queryParts.join(' ')

    if (!query.trim()) {
      return NextResponse.json({ error: 'Address query cannot be empty' }, { status: 400 })
    }

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

    // Build request URL based on service
    let requestUrl: string
    const headers: HeadersInit = {
      'User-Agent': 'AdaptMapKoeln/1.0',
    }

    if (useLocationIQ) {
      // LocationIQ API (European server, higher limits)
      requestUrl = `${LOCATIONIQ_BASE_URL}/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=de`
    } else {
      // Public Photon (fallback)
      requestUrl = `${PHOTON_URL}/api?q=${encodeURIComponent(query)}&limit=1&lang=de`
    }

    // Make request to geocoding service with retry logic
    const response = await fetchWithRetry(requestUrl, {
      headers,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      // Provide more specific error messages
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Geocoding service rate limit exceeded. Please try again later.' },
          { status: 429 },
        )
      }
      if (response.status === 503) {
        return NextResponse.json(
          { error: 'Geocoding service temporarily unavailable. Please try again later.' },
          { status: 503 },
        )
      }
      throw new Error(`Geocoding service returned status ${response.status}`)
    }

    const data = await response.json()

    // Handle LocationIQ response format (different from Photon)
    if (useLocationIQ) {
      // LocationIQ returns array directly
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json(
          { error: 'Address not found. Please check your input and try again.' },
          { status: 404 },
        )
      }

      const result = data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: 'Invalid coordinates returned from geocoding service' },
          { status: 500 },
        )
      }

      const geocodeResult = {
        lat,
        lng,
        postal_code: result.address?.postcode || postalcode || null,
        city: result.address?.city || result.address?.town || result.address?.village || city || null,
        address: result.display_name || query,
      }

      // Cache the result
      geocodeCache.set(cacheKey, geocodeResult)

      return NextResponse.json(geocodeResult)
    }

    // Handle Photon response format (GeoJSON)
    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: 'Address not found. Please check your input and try again.' },
        { status: 404 },
      )
    }

    const feature = data.features[0]
    const [lng, lat] = feature.geometry.coordinates

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates returned from geocoding service' },
        { status: 500 },
      )
    }

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

    // Handle specific error types
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Geocoding request timed out. Please try again.' },
        { status: 504 },
      )
    }

    if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Cannot connect to geocoding service. Please check your connection.' },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to geocode address' },
      { status: 500 },
    )
  }
}
