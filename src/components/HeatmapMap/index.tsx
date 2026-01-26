'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import React, { useEffect, useRef, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import type { Map as MapLibreMap } from 'maplibre-gl'

import type { Location } from '@/providers/Submission/types'
import { InfluenceDiskLayer } from './InfluenceDiskLayer'

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
    value: number // Normalized problem_index (0-1)
    weight: number // Weight for blending
  }
}

type GeoJSONData = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

type HeatmapMapProps = {
  userLocation?: Location | null
  className?: string
  dataUrl?: string // Optional API endpoint URL (defaults to '/api/heatmap')
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

// Default radius in meters for influence disks
const DEFAULT_RADIUS_METERS = 5000 // 5000m (5km) radius per data point


// Default center: Cologne, Germany
const DEFAULT_CENTER = {
  longitude: 6.9603,
  latitude: 50.9375,
  zoom: 6,
}

export function HeatmapMap({ userLocation, className, dataUrl = '/api/heatmap' }: HeatmapMapProps) {
  const [viewState, setViewState] = useState({
    longitude: userLocation?.lng || DEFAULT_CENTER.longitude,
    latitude: userLocation?.lat || DEFAULT_CENTER.latitude,
    zoom: userLocation ? 10 : DEFAULT_CENTER.zoom,
  })
  const [heatmapData, setHeatmapData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = React.useRef<MapRef>(null)
  const customLayerRef = useRef<InfluenceDiskLayer | null>(null)

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(dataUrl)
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
  }, [dataUrl])

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

  // Setup layer when data is ready
  const setupLayer = React.useCallback(() => {
    if (!mapRef.current || !heatmapData) {
      return
    }

    const map = mapRef.current.getMap() as MapLibreMap

    // Remove existing layer if it exists
    if (customLayerRef.current) {
      if (map.getLayer(customLayerRef.current.id)) {
        map.removeLayer(customLayerRef.current.id)
      }
      customLayerRef.current = null
    }

    // Create and add new layer
    const layer = new InfluenceDiskLayer({
      id: 'influence-disk-layer',
      data: heatmapData,
      radiusMeters: DEFAULT_RADIUS_METERS,
      opacity: 0.8,
    })

    try {
      map.addLayer(layer)
      customLayerRef.current = layer
      map.triggerRepaint()
    } catch (error) {
      console.error('[HeatmapMap] Error adding layer:', error)
    }
  }, [heatmapData])

  // Setup layer when map loads and data is available
  const handleMapLoad = React.useCallback(() => {
    // Small delay to ensure map tiles render first
    setTimeout(() => {
      setupLayer()
    }, 100)
  }, [setupLayer])

  // Update layer when data changes (if map is already loaded)
  useEffect(() => {
    if (!mapRef.current || !heatmapData) {
      return
    }

    const map = mapRef.current.getMap() as MapLibreMap
    if (map.loaded()) {
      setupLayer()
    }
  }, [heatmapData, setupLayer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current && customLayerRef.current) {
        const map = mapRef.current.getMap() as MapLibreMap
        if (map.getLayer(customLayerRef.current.id)) {
          map.removeLayer(customLayerRef.current.id)
        }
        customLayerRef.current = null
      }
    }
  }, [])

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
        onLoad={handleMapLoad}
        mapStyle={
          // Default to open-source Carto Positron style
          // MapTiler is optional and only used if explicitly configured
          process.env.NEXT_PUBLIC_MAPTILER_API_KEY
            ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}&lang=de`
            : // Open-source Positron style (minimal, modern, shows green areas)
              // Note: Labels will be in local language (German for German locations)
              'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        }
        style={{ width: '100%', height: '100%' }}
        reuseMaps={true}
      >
        {/* Custom influence disk layer is added via onLoad callback */}
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
          <span>Niedrig (0)</span>
          <span>Hoch (100)</span>
        </div>
        <p className="mt-1 text-[9px] text-gray-500 sm:text-[10px]">
          Problem-Index (durchschnittlich)
        </p>
      </div>
    </div>
  )
}
