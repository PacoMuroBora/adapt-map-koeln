import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

import type { Submission } from '@/payload-types'

// In-memory cache (consider Redis for production)
let cachedData: any = null
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
    const submissions = await payload.find({
      collection: 'submissions',
      limit: 10000, // Adjust based on expected volume
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
          // Use a representative point for the postal code
          // This could be improved with a postal code centroid database
          lat: location.lat,
          lng: location.lng,
        }
      }

      postalCodeData[postalCode].count += 1
      postalCodeData[postalCode].totalProblemIndex += submissionData.problem_index || 0
    })

    // Convert to GeoJSON
    const features: GeoJSONFeature[] = Object.entries(postalCodeData).map(([postalCode, data]) => {
      const avgProblemIndex = data.count > 0 ? data.totalProblemIndex / data.count : 0

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
