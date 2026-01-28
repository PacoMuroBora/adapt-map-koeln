'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import type { Map as MapLibreMap } from 'maplibre-gl'

import type { Location } from '@/providers/Submission/types'
import { GridTileLayer } from './GridTileLayer'
import { TileTooltip } from './TileTooltip'

const EARTH_RADIUS = 6378137
const MAX_LAT = 85.05112878

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
  return { lng, lat: clampLat(lat) }
}

type GridFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    tileX: number
    tileY: number
    tileSizeMeters: number
    averageProblemIndex: number
    totalCount: number
    valueCounts: Record<number, number>
    value: number
  }
}

type GridData = {
  type: 'FeatureCollection'
  features: GridFeature[]
}

type HeatmapMapProps = {
  userLocation?: Location | null
  className?: string
  dataUrl?: string
  /** Draw magenta lines on tile limits (same as colored square). Overridden by ?debugTileBounds=1 in URL. */
  debugTileBounds?: boolean
}

const COLOR_STOPS = [
  '#1a5f5f',
  '#1e3a5f',
  '#2e5a8a',
  '#4a90c2',
  '#87ceeb',
  '#fffacd',
  '#ffd700',
  '#ffb347',
  '#cd853f',
  '#8b4513',
]

const DEFAULT_CENTER = { longitude: 6.9603, latitude: 50.9375, zoom: 6 }

function getTileAtPoint(
  pointX: number,
  pointY: number,
  features: GridFeature[],
  map: MapLibreMap,
  tileSizeMeters: number,
): GridFeature | null {
  const lngLat = map.unproject([pointX, pointY])
  const { x, y } = lngLatToMercator(lngLat.lng, lngLat.lat)
  const tileX = Math.floor(x / tileSizeMeters)
  const tileY = Math.floor(y / tileSizeMeters)

  return features.find((f) => f.properties.tileX === tileX && f.properties.tileY === tileY) ?? null
}

// ?debugTileBounds=1 or ?debug=1 in URL to show tile-limit lines
function getDebugFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  const u = new URL(window.location.href)
  return u.searchParams.get('debugTileBounds') === '1' || u.searchParams.get('debug') === '1'
}

export function HeatmapMap({
  userLocation,
  className,
  dataUrl = '/api/heatmap-grid',
  debugTileBounds: debugTileBoundsProp,
}: HeatmapMapProps) {
  const [debugFromUrl, setDebugFromUrl] = useState(false)
  const [debugRects, setDebugRects] = useState<
    Array<{ x: number; y: number; w: number; h: number }>
  >([])

  useEffect(() => {
    setDebugFromUrl(getDebugFromUrl())
  }, [])
  const debugTileBounds = debugTileBoundsProp ?? debugFromUrl

  const [viewState, setViewState] = useState({
    longitude: userLocation?.lng ?? DEFAULT_CENTER.longitude,
    latitude: userLocation?.lat ?? DEFAULT_CENTER.latitude,
    zoom: userLocation ? 10 : DEFAULT_CENTER.zoom,
  })
  const [tileSizeMeters, setTileSizeMeters] = useState(500)
  const [gridData, setGridData] = useState<GridData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredTile, setHoveredTile] = useState<GridFeature | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const mapRef = useRef<MapRef>(null)
  const layerRef = useRef<GridTileLayer | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch tile size and map center from settings
  useEffect(() => {
    let ignore = false
    fetch('/api/heatmap-settings')
      .then((r) => r.json())
      .then(
        (d: {
          tileSizeMeters?: number
          mapCenter?: { lat?: number; lng?: number; zoom?: number }
        }) => {
          if (ignore) return

          if (typeof d?.tileSizeMeters === 'number') {
            const tileSize = d.tileSizeMeters
            setTileSizeMeters((p) => (p === tileSize ? p : tileSize))
          }

          // Update map center/zoom from settings if no user location
          if (!userLocation && d?.mapCenter) {
            const { lat, lng, zoom } = d.mapCenter
            if (typeof lat === 'number' && typeof lng === 'number' && typeof zoom === 'number') {
              console.log('[HeatmapMap] Setting initial view from SiteSettings:', {
                lat,
                lng,
                zoom,
              })
              setViewState((p) => ({
                ...p,
                longitude: lng,
                latitude: lat,
                zoom,
              }))
            } else {
              console.warn('[HeatmapMap] Invalid mapCenter from API:', d.mapCenter)
            }
          } else if (userLocation) {
            console.log('[HeatmapMap] Using userLocation, ignoring SiteSettings mapCenter')
          }
        },
      )
      .catch((err) => {
        console.error('[HeatmapMap] Failed to fetch heatmap-settings:', err)
      })
    return () => {
      ignore = true
    }
  }, [userLocation])

  // Fetch grid data
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    const url = `${dataUrl}?tileSize=${tileSizeMeters}`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Heatmap: ${r.statusText}`)
        return r.json()
      })
      .then((d: GridData) => {
        setGridData(d)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Heatmap-Daten konnten nicht geladen werden.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [dataUrl, tileSizeMeters])

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setViewState((p) => ({
        ...p,
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 10,
      }))
    }
  }, [userLocation])

  const setupLayer = useCallback(() => {
    if (!mapRef.current || !gridData) return
    const map = mapRef.current.getMap() as MapLibreMap
    if (layerRef.current) {
      if (map.getLayer(layerRef.current.id)) map.removeLayer(layerRef.current.id)
      layerRef.current = null
    }
    const layer = new GridTileLayer({
      id: 'grid-tile-layer',
      data: gridData,
      tileSizeMeters,
      opacity: 0.4,
      debugBounds: debugTileBounds,
    })
    map.addLayer(layer)
    layerRef.current = layer
    map.triggerRepaint()
  }, [gridData, tileSizeMeters, debugTileBounds])

  const onMapLoad = useCallback(() => {
    setTimeout(setupLayer, 100)
  }, [setupLayer])

  useEffect(() => {
    if (!mapRef.current || !gridData) return
    const map = mapRef.current.getMap() as MapLibreMap
    if (map.loaded()) setupLayer()
  }, [gridData, setupLayer])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      // Read refs in cleanup to get current values at unmount (eslint-disable: refs are null at mount)
      const map = mapRef.current?.getMap() as MapLibreMap | undefined
      const layer = layerRef.current
      if (map && layer && map.getLayer(layer.id)) map.removeLayer(layer.id)
      layerRef.current = null
    }
  }, [])

  const pickAndShow = useCallback(
    (evt: MapLayerMouseEvent, fromClick: boolean) => {
      const map = mapRef.current?.getMap() as MapLibreMap | undefined
      if (!map || !gridData?.features.length) return
      const { x, y } = evt.point
      const t = getTileAtPoint(x, y, gridData.features, map, tileSizeMeters)
      setHoveredTile(t)
      setTooltipPos(t ? { x: x + 12, y: y + 12 } : null)
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      if (fromClick && t) {
        hideTimerRef.current = setTimeout(() => {
          setHoveredTile(null)
          setTooltipPos(null)
          hideTimerRef.current = null
        }, 2500)
      }
    },
    [gridData, tileSizeMeters],
  )

  const onMouseMove = useCallback(
    (evt: MapLayerMouseEvent) => {
      pickAndShow(evt, false)

      // Debug: show geographic tile bounds as green overlay rectangles
      if (debugTileBounds && gridData?.features && mapRef.current) {
        const map = mapRef.current.getMap() as MapLibreMap
        const rects: Array<{ x: number; y: number; w: number; h: number }> = []
        for (const f of gridData.features) {
          const ts = f.properties.tileSizeMeters ?? tileSizeMeters
          const tileX = f.properties.tileX
          const tileY = f.properties.tileY

          const minX = tileX * ts
          const minY = tileY * ts
          const maxX = minX + ts
          const maxY = minY + ts

          const nw = mercatorToLngLat(minX, maxY)
          const se = mercatorToLngLat(maxX, minY)

          const nwPt = map.project([nw.lng, nw.lat])
          const sePt = map.project([se.lng, se.lat])

          rects.push({
            x: nwPt.x,
            y: nwPt.y,
            w: sePt.x - nwPt.x,
            h: sePt.y - nwPt.y,
          })
        }
        setDebugRects(rects)
      } else {
        setDebugRects([])
      }
    },
    [pickAndShow, debugTileBounds, gridData, tileSizeMeters],
  )

  const onMouseLeave = useCallback(() => {
    setHoveredTile(null)
    setTooltipPos(null)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const onClick = useCallback(
    (evt: MapLayerMouseEvent) => {
      pickAndShow(evt, true)
    },
    [pickAndShow],
  )

  if (isLoading) {
    return (
      <div className={`flex h-full items-center justify-center ${className ?? ''}`}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Heatmap wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex h-full items-center justify-center ${className ?? ''}`}>
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
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={onMapLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        mapStyle={
          process.env.NEXT_PUBLIC_MAPTILER_API_KEY
            ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}&lang=de`
            : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        }
        style={{ width: '100%', height: '100%' }}
        reuseMaps={true}
      />
      {hoveredTile && tooltipPos && (
        <TileTooltip
          totalCount={hoveredTile.properties.totalCount}
          averageProblemIndex={hoveredTile.properties.averageProblemIndex}
          valueCounts={hoveredTile.properties.valueCounts}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}

      {/* Debug: green overlay rectangles showing geographic tile bounds (hover detection area) */}
      {debugTileBounds &&
        debugRects.map((r: { x: number; y: number; w: number; h: number }, i: number) => (
          <div
            key={i}
            className="absolute border-2 border-green-500 pointer-events-none"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          />
        ))}

      {/* Debug info overlay */}
      {debugTileBounds && (
        <div className="absolute top-2 left-2 rounded-lg border border-yellow-500 bg-black/80 p-2 text-white text-xs font-mono pointer-events-none max-w-xs">
          <p className="font-bold text-yellow-300 mb-1">DEBUG MODE</p>
          <p>Tile Size: {tileSizeMeters}m (from CMS)</p>
          <p>Zoom: {viewState.zoom.toFixed(2)}</p>
          <p className="mt-1 text-yellow-200">🟪 Magenta = WebGL drawn tile</p>
          <p className="text-green-400">🟩 Green = Geographic bounds (hover area)</p>
          <p className="mt-1 text-xs text-gray-300">
            If green is larger than magenta,
            <br />
            the rendering is too small.
          </p>
        </div>
      )}

      <div className="absolute bottom-2 left-2 rounded-lg border border-border/50 bg-white p-2 shadow-lg sm:bottom-4 sm:left-4 sm:p-3">
        <h3 className="mb-1.5 text-xs font-bold text-gray-900 sm:mb-2 sm:text-sm">Legende</h3>
        <div className="mb-2 h-3 w-full overflow-hidden rounded border border-gray-300 sm:mb-2.5 sm:h-4">
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(to right, ${COLOR_STOPS.join(', ')})` }}
          />
        </div>
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
