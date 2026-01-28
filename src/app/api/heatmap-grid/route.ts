import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

import type { Submission } from '@/payload-types'

const EARTH_RADIUS = 6378137
const MAX_LAT = 85.05112878

// In-memory cache per tileSize (consider Redis for production)
let cachedData: GeoJSONResponse | null = null
let cacheTileSize: number | null = null
let cacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

type TileData = {
  totalProblemIndex: number
  totalCount: number
  valueCounts: Record<number, number>
  tileX: number
  tileY: number
}

type GeoJSONFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    tileX: number
    tileY: number
    tileSizeMeters: number
    averageProblemIndex: number
    totalCount: number
    valueCounts: Record<number, number>
    value: number // Normalized 0-1 for color mapping
  }
}

type GeoJSONResponse = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

function clampLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))
}

function lngLatToMercator(lng: number, lat: number): { x: number; y: number } {
  const clampedLat = clampLat(lat)
  const x = (lng * Math.PI * EARTH_RADIUS) / 180
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (clampedLat * Math.PI) / 360))
  return { x, y }
}

function mercatorToLngLat(x: number, y: number): { lng: number; lat: number } {
  const lng = (x / EARTH_RADIUS) * (180 / Math.PI)
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI)
  return { lng, lat }
}

function getTileKey(
  lat: number,
  lng: number,
  tileSizeMeters: number,
): { tileX: number; tileY: number } {
  const { x, y } = lngLatToMercator(lng, lat)
  return {
    tileX: Math.floor(x / tileSizeMeters),
    tileY: Math.floor(y / tileSizeMeters),
  }
}

export const revalidate = 300 // ISR revalidation: 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let tileSizeMeters = Number(searchParams.get('tileSize') ?? 500)
    if (!Number.isFinite(tileSizeMeters) || tileSizeMeters < 50) tileSizeMeters = 50
    if (tileSizeMeters > 5000) tileSizeMeters = 5000

    // Check cache (same tileSize)
    const now = Date.now()
    if (cachedData && cacheTileSize === tileSizeMeters && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    const payload = await getPayloadClient()

    const submissions = await payload.find({
      collection: 'submissions',
      limit: 0,
      depth: 0,
      select: {
        location: true,
        problem_index: true,
      },
      overrideAccess: true,
    })

    const tileMap = new Map<string, TileData>()

    for (const doc of submissions.docs) {
      const s = doc as Submission
      const loc = s.location
      if (!loc?.lat || !loc.lng) continue

      const pi = s.problem_index ?? 0
      const { tileX, tileY } = getTileKey(loc.lat, loc.lng, tileSizeMeters)
      const key = `${tileX},${tileY}`

      let t = tileMap.get(key)
      if (!t) {
        t = {
          totalProblemIndex: 0,
          totalCount: 0,
          valueCounts: {},
          tileX,
          tileY,
        }
        tileMap.set(key, t)
      }

      t.totalCount += 1
      t.totalProblemIndex += pi
      const bin = Math.round(pi)
      t.valueCounts[bin] = (t.valueCounts[bin] ?? 0) + 1
    }

    const features: GeoJSONFeature[] = []

    for (const t of tileMap.values()) {
      if (t.totalCount === 0) continue

      const centerX = (t.tileX + 0.5) * tileSizeMeters
      const centerY = (t.tileY + 0.5) * tileSizeMeters
      const { lng: centerLng, lat: centerLat } = mercatorToLngLat(centerX, centerY)

      const avg = t.totalProblemIndex / t.totalCount
      const value = Math.max(0, Math.min(1, avg / 100))

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [centerLng, centerLat],
        },
        properties: {
          tileX: t.tileX,
          tileY: t.tileY,
          tileSizeMeters,
          averageProblemIndex: Math.round(avg * 100) / 100,
          totalCount: t.totalCount,
          valueCounts: t.valueCounts,
          value: Math.round(value * 1000) / 1000,
        },
      })
    }

    const geoJson: GeoJSONResponse = {
      type: 'FeatureCollection',
      features,
    }

    cachedData = geoJson
    cacheTileSize = tileSizeMeters
    cacheTime = now

    return NextResponse.json(geoJson, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Heatmap grid API error:', error)
    return NextResponse.json({ error: 'Failed to generate heatmap grid data' }, { status: 500 })
  }
}
