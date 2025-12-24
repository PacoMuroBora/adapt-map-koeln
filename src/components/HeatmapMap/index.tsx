'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import React, { useEffect, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import { Source, Layer, Marker } from 'react-map-gl/maplibre'
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

// Heatmap layer configuration
const heatmapLayer = {
  id: 'heatmap',
  type: 'heatmap' as const,
  paint: {
    // Weight based on average_problem_index (0-100)
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'average_problem_index'], 0, 0, 100, 1],
    // Intensity increases with zoom
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
    // Color gradient: blue (low) to red (high)
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(33,102,172,0)', // Transparent blue
      0.2,
      'rgb(103,169,207)', // Light blue
      0.4,
      'rgb(209,229,240)', // Very light blue
      0.6,
      'rgb(253,219,199)', // Light orange
      0.8,
      'rgb(239,138,98)', // Orange
      1,
      'rgb(178,24,43)', // Red
    ],
    // Radius increases with zoom
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
    // Opacity decreases slightly at higher zoom
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0.7],
  },
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
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
        reuseMaps={true}
      >
        {/* Heatmap layer */}
        {heatmapData && (
          <Source type="geojson" data={heatmapData}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {/* User location marker */}
        {userLocation?.lat && userLocation?.lng && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative">
              {/* Outer pulse ring */}
              <div className="absolute h-8 w-8 animate-ping rounded-full bg-primary opacity-75" />
              {/* Inner marker */}
              <div className="relative h-4 w-4 rounded-full border-2 border-white bg-primary shadow-lg" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Legend overlay - mobile responsive */}
      <div className="absolute bottom-2 left-2 rounded-lg bg-white p-2 shadow-lg border border-border/50 sm:bottom-4 sm:left-4 sm:p-3">
        <h3 className="mb-1.5 text-xs font-bold text-gray-900 sm:mb-2 sm:text-sm">Legende</h3>
        <div className="space-y-1 text-[10px] text-gray-900 sm:space-y-1.5 sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 rounded bg-blue-500 sm:h-3 sm:w-3" />
            <span className="text-gray-900">Niedrig (0-40)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 rounded bg-yellow-500 sm:h-3 sm:w-3" />
            <span className="text-gray-900">Mittel (40-70)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 rounded bg-red-500 sm:h-3 sm:w-3" />
            <span className="text-gray-900">Hoch (70-100)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
