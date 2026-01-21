'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import React, { useEffect, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import { Source, Layer } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'

import type { Location } from '@/providers/Submission/types'

type GeoJSONFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: {
    postalCode: string
    count: number
    average_problem_index: number
  }
}

type GeoJSONData = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

type HeatmapMapProps = {
  userLocation?: Location | null
  className?: string
}

// Color stops matching HeatIntensitySlider (0-9, 10 colors)
const COLOR_STOPS = [
  '#1a5f5f', // Dark Teal/Blue-Green
  '#1e3a5f', // Dark Blue
  '#2e5a8a', // Medium Blue
  '#4a90c2', // Lighter Blue
  '#87ceeb', // Pale Blue
  '#fffacd', // Pale Yellow
  '#ffd700', // Bright Yellow
  '#ffb347', // Light Orange/Peach
  '#cd853f', // Medium Orange/Reddish-Brown
  '#8b4513', // Dark Brown/Reddish-Brown
]

// Circle layer - each point shows its value color fading to transparent
// Gradients only appear naturally when multiple circles overlap
const circleLayer = {
  id: 'heatmap-circles',
  type: 'circle' as const,
  paint: {
    // Large radius for visibility
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 40, 9, 100],
    // Color based on average_problem_index value (0-100) mapped to COLOR_STOPS (0-9)
    'circle-color': [
      'interpolate',
      ['linear'],
      ['get', 'average_problem_index'],
      0,
      COLOR_STOPS[0],
      11.11,
      COLOR_STOPS[1],
      22.22,
      COLOR_STOPS[2],
      33.33,
      COLOR_STOPS[3],
      44.44,
      COLOR_STOPS[4],
      55.55,
      COLOR_STOPS[5],
      66.66,
      COLOR_STOPS[6],
      77.77,
      COLOR_STOPS[7],
      88.88,
      COLOR_STOPS[8],
      100,
      COLOR_STOPS[9],
    ],
    'circle-opacity': 1,
    'circle-stroke-width': 0,
    // Blur creates fade-to-transparent effect at edges
    // Reduced blur so center stays more opaque
    'circle-blur': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 2],
  } as any,
}

// Medium circle layer - adds more opacity at center
const mediumCircleLayer = {
  id: 'heatmap-medium-circles',
  type: 'circle' as const,
  paint: {
    // Medium radius
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 9, 35],
    'circle-color': [
      'interpolate',
      ['linear'],
      ['get', 'average_problem_index'],
      0,
      COLOR_STOPS[0],
      11.11,
      COLOR_STOPS[1],
      22.22,
      COLOR_STOPS[2],
      33.33,
      COLOR_STOPS[3],
      44.44,
      COLOR_STOPS[4],
      55.55,
      COLOR_STOPS[5],
      66.66,
      COLOR_STOPS[6],
      77.77,
      COLOR_STOPS[7],
      88.88,
      COLOR_STOPS[8],
      100,
      COLOR_STOPS[9],
    ],
    'circle-opacity': 1,
    'circle-stroke-width': 0,
    'circle-blur': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 9, 1], // Less blur for more solid center
  } as any,
}

// Small solid circle layer - shows exact color-coded value at center
const centerCircleLayer = {
  id: 'heatmap-center-circles',
  type: 'circle' as const,
  paint: {
    // Small radius for center point
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 6, 9, 15],
    // Color based on average_problem_index value (0-100) mapped to COLOR_STOPS (0-9)
    'circle-color': [
      'interpolate',
      ['linear'],
      ['get', 'average_problem_index'],
      0,
      COLOR_STOPS[0],
      11.11,
      COLOR_STOPS[1],
      22.22,
      COLOR_STOPS[2],
      33.33,
      COLOR_STOPS[3],
      44.44,
      COLOR_STOPS[4],
      55.55,
      COLOR_STOPS[5],
      66.66,
      COLOR_STOPS[6],
      77.77,
      COLOR_STOPS[7],
      88.88,
      COLOR_STOPS[8],
      100,
      COLOR_STOPS[9],
    ],
    'circle-opacity': 1,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
    'circle-blur': 0, // No blur - solid circle
  } as any,
}


// Default center: Cologne, Germany
const DEFAULT_CENTER = {
  longitude: 6.9603,
  latitude: 50.9375,
  zoom: 6,
}

export function HeatmapMap({ userLocation, className }: HeatmapMapProps) {
  const [viewState, setViewState] = useState({
    longitude: userLocation?.lng || DEFAULT_CENTER.longitude,
    latitude: userLocation?.lat || DEFAULT_CENTER.latitude,
    zoom: userLocation ? 10 : DEFAULT_CENTER.zoom,
  })
  const [heatmapData, setHeatmapData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = React.useRef<MapRef>(null)

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/heatmap')
        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.statusText}`)
        }
        const data: GeoJSONData = await response.json()
        setHeatmapData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch heatmap data'
        console.error('Heatmap data fetch error:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHeatmapData()
  }, [])

  // Update view state when user location changes
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setViewState((prev) => ({
        ...prev,
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 10, // Zoom in when user location is available
      }))
    }
  }, [userLocation])

  if (isLoading) {
    return (
      <div className={`flex h-full items-center justify-center ${className || ''}`}>
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Heatmap wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex h-full items-center justify-center ${className || ''}`}>
        <div className="text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full w-full ${className || ''}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={
          process.env.NEXT_PUBLIC_MAPTILER_API_KEY
            ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}&lang=de`
            : // Fallback: Use Positron style (minimal, modern, shows green areas)
              // Note: Labels will be in local language (German for German locations)
              'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        }
        style={{ width: '100%', height: '100%' }}
        reuseMaps={true}
      >
        {/* Multiple circle layers for better opacity at center */}
        {heatmapData && (
          <Source type="geojson" data={heatmapData}>
            <Layer {...circleLayer} />
            <Layer {...mediumCircleLayer} />
            <Layer {...centerCircleLayer} />
          </Source>
        )}
      </Map>

      {/* Legend overlay - mobile responsive */}
      <div className="absolute bottom-2 left-2 rounded-lg bg-white p-2 shadow-lg border border-border/50 sm:bottom-4 sm:left-4 sm:p-3">
        <h3 className="mb-1.5 text-xs font-bold text-gray-900 sm:mb-2 sm:text-sm">Legende</h3>
        {/* Color gradient bar */}
        <div className="mb-2 h-3 w-full overflow-hidden rounded border border-gray-300 sm:h-4 sm:mb-2.5">
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(to right, ${COLOR_STOPS.join(', ')})`,
            }}
          />
        </div>
        {/* Labels */}
        <div className="flex justify-between text-[10px] text-gray-600 sm:text-xs">
          <span>Niedrig</span>
          <span>Hoch</span>
        </div>
      </div>
    </div>
  )
}
