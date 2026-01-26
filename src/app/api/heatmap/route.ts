import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

import type { Submission } from '@/payload-types'

// In-memory cache (consider Redis for production)
let cachedData: GeoJSONResponse | null = null
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

type PostalCodeData = {
  count: number
  totalProblemIndex: number
  lat: number
  lng: number
}

type GeoJSONFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    postalCode: string
    count: number
    average_problem_index: number
    value: number // Normalized problem_index (0-1)
    weight: number // Weight for blending (log-scaled count to prevent saturation)
  }
}

type GeoJSONResponse = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export const revalidate = 300 // ISR revalidation: 5 minutes

export async function GET() {
  try {
    // Check cache
    const now = Date.now()
    if (cachedData && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    const payload = await getPayloadClient()

    // Aggregate submissions by postal code
    // Using overrideAccess: true because this is public aggregated data
    // Individual submissions are still protected by access control
    // Fetch ALL submissions (no limit) to ensure complete data
    const submissions = await payload.find({
      collection: 'submissions',
      limit: 0, // 0 means no limit - fetch all submissions
      depth: 0, // Only need location and problem_index
      select: {
        location: true,
        problem_index: true,
      },
      overrideAccess: true, // Public aggregated data
    })

    const postalCodeData: Record<string, PostalCodeData> = {}

    submissions.docs.forEach((submission) => {
      const submissionData = submission as Submission
      const location = submissionData.location

      if (!location?.postal_code || !location.lat || !location.lng) {
        return // Skip submissions without valid location data
      }

      const postalCode = location.postal_code

      if (!postalCodeData[postalCode]) {
        postalCodeData[postalCode] = {
          count: 0,
          totalProblemIndex: 0,
          // Initialize with first location, will be averaged
          lat: location.lat,
          lng: location.lng,
        }
      }

      postalCodeData[postalCode].count += 1
      postalCodeData[postalCode].totalProblemIndex += submissionData.problem_index || 0
      
      // Average coordinates for privacy - prevents pinpointing exact locations
      // This creates a centroid for the postal code area
      const currentLat = postalCodeData[postalCode].lat
      const currentLng = postalCodeData[postalCode].lng
      const count = postalCodeData[postalCode].count
      
      // Running average: new_avg = (old_avg * (n-1) + new_value) / n
      postalCodeData[postalCode].lat = (currentLat * (count - 1) + location.lat) / count
      postalCodeData[postalCode].lng = (currentLng * (count - 1) + location.lng) / count
    })

    // Convert to GeoJSON
    const features: GeoJSONFeature[] = Object.entries(postalCodeData).map(([postalCode, data]) => {
      const avgProblemIndex = data.count > 0 ? data.totalProblemIndex / data.count : 0

      // Normalize problem_index (0-100) to value (0-1) for consistent rendering
      const value = Math.max(0, Math.min(1, avgProblemIndex / 100))

      // Calculate weight: log-scaled count to prevent early saturation
      // This ensures areas with many reports have more influence, but doesn't instantly max out
      // Using log base 2: weight = log2(count + 1) / log2(maxCount + 1)
      // For now, we'll use a simpler approach: sqrt(count) normalized to reasonable max
      // This gives diminishing returns: 1->1, 4->2, 9->3, 16->4, etc.
      const maxExpectedCount = 50 // Reasonable max for postal code aggregation
      const weight = Math.min(1.0, Math.sqrt(data.count) / Math.sqrt(maxExpectedCount))

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [data.lng, data.lat], // GeoJSON format: [lng, lat]
        },
        properties: {
          postalCode,
          count: data.count,
          average_problem_index: Math.round(avgProblemIndex * 100) / 100, // Round to 2 decimals
          value: Math.round(value * 1000) / 1000, // Round to 3 decimals for precision
          weight: Math.round(weight * 1000) / 1000, // Round to 3 decimals
        },
      }
    })

    const geoJson: GeoJSONResponse = {
      type: 'FeatureCollection',
      features,
    }

    // Update cache
    cachedData = geoJson
    cacheTime = now

    return NextResponse.json(geoJson, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Heatmap API error:', error)
    return NextResponse.json({ error: 'Failed to generate heatmap data' }, { status: 500 })
  }
}
