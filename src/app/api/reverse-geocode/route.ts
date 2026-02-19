import { NextRequest, NextResponse } from 'next/server'
import { geocodeCache, createCacheKey } from '@/utilities/geocodeCache'

// Geocoding service configuration with fallback chain:
// 1. LocationIQ (if API key provided) - European, 5,000 req/day free, Nominatim-based
// 2. Custom GEOCODING_URL (if set)
// 3. Public Nominatim (fallback)
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY
const LOCATIONIQ_BASE_URL = process.env.LOCATIONIQ_BASE_URL || 'https://eu1.locationiq.com/v1'
const GEOCODING_URL = process.env.GEOCODING_URL || 'https://nominatim.openstreetmap.org'

// Determine which service to use
const useLocationIQ = Boolean(LOCATIONIQ_API_KEY)

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const RATE_LIMIT_DELAY = 2000 // 2 seconds for rate-limited public services (Nominatim: 1 req/sec)

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

      // If rate limited (429), wait longer before retry (Nominatim has 1 req/sec limit)
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
    const { lat, lng } = await req.json()

    // Validate required fields
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    // Validate coordinate ranges
    const latitude = Number(lat)
    const longitude = Number(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Latitude and longitude must be valid numbers' },
        { status: 400 },
      )
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: 'Latitude must be between -90 and 90' }, { status: 400 })
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Longitude must be between -180 and 180' }, { status: 400 })
    }

    // Create cache key from coordinates (round to 4 decimal places for cache efficiency)
    // This groups nearby coordinates together, which is fine for postal code lookup
    const roundedLat = latitude.toFixed(4)
    const roundedLng = longitude.toFixed(4)
    const cacheKey = createCacheKey('reverse-geocode', {
      lat: roundedLat,
      lng: roundedLng,
    })

    // Check cache first
    const cached = geocodeCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build request URL based on service
    let requestUrl: string
    const headers: HeadersInit = {
      'User-Agent': 'AdaptMapKoeln/1.0', // Required by public Nominatim API
    }

    if (useLocationIQ) {
      // LocationIQ API (European server, higher limits)
      requestUrl = `${LOCATIONIQ_BASE_URL}/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
    } else {
      // Public Nominatim (fallback)
      requestUrl = `${GEOCODING_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
    }

    // Make request to reverse geocoding service with retry logic
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

    // Check for Nominatim error response
    if (data.error) {
      return NextResponse.json(
        { error: data.error || 'Failed to reverse geocode location' },
        { status: 400 },
      )
    }

    const result = {
      postal_code: data.address?.postcode || null,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      street: data.address?.road || null,
      house_number: data.address?.house_number || null,
      address: data.display_name || null,
    }

    // Cache the result (don't cache errors)
    geocodeCache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Reverse geocoding error:', error)

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
      { error: error.message || 'Failed to reverse geocode location' },
      { status: 500 },
    )
  }
}
