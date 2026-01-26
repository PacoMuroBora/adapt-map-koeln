'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HeatmapMap } from '@/components/HeatmapMap'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { InfluenceDiskLayerDebug } from '@/components/HeatmapMap/InfluenceDiskLayerDebug'

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
    value: number
    weight: number
  }
}

type GeoJSONData = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export default function HeatmapDebugPage() {
  const [realData, setRealData] = useState<GeoJSONData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useTestData, setUseTestData] = useState(true)
  const mapRef = useRef<MapRef>(null)
  const debugLayerRef = useRef<InfluenceDiskLayerDebug | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Debug layer generates its own test points, so we only need real data for comparison
        const realResponse = await fetch('/api/heatmap')
        if (!realResponse.ok) throw new Error('Failed to fetch real data')
        const real: GeoJSONData = await realResponse.json()
        setRealData(real)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
        console.error('[Debug] Error:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current && debugLayerRef.current) {
        const map = mapRef.current.getMap() as MapLibreMap
        if (map.getLayer(debugLayerRef.current.id)) {
          map.removeLayer(debugLayerRef.current.id)
        }
        debugLayerRef.current = null
      }
    }
  }, [])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Heatmap Debug</h1>
          <p className="text-muted-foreground">
            Debug-Seite zum Testen der Heatmap-Visualisierung mit radialem Falloff. Zeigt 8
            Test-Punkte in einer Reihe bei Bonn. Öffne die Browser-Konsole für detaillierte Logs.
          </p>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={useTestData}
                  onChange={() => setUseTestData(true)}
                  className="h-4 w-4"
                />
                <span>Test-Daten (20 Dummy-Punkte)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!useTestData}
                  onChange={() => setUseTestData(false)}
                  className="h-4 w-4"
                />
                <span>Echte Daten</span>
              </label>
            </div>

            {useTestData ? (
              <div className="rounded bg-gray-100 p-3 text-sm">
                <p>
                  <strong>Datenquelle:</strong> Test (Debug Layer)
                </p>
                <p>
                  <strong>Anzahl Features:</strong> 8 (generiert vom Debug Layer)
                </p>
                <p>
                  <strong>Hinweis:</strong> Der Debug Layer generiert 8 Test-Punkte in einer Reihe bei Bonn.
                </p>
              </div>
            ) : (
              realData && (
                <div className="rounded bg-gray-100 p-3 text-sm">
                  <p>
                    <strong>Datenquelle:</strong> Real
                  </p>
                  <p>
                    <strong>Anzahl Features:</strong> {realData.features.length}
                  </p>
                  <p>
                    <strong>Erste 3 Features:</strong>
                  </p>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-white p-2 text-xs">
                    {JSON.stringify(realData.features.slice(0, 3), null, 2)}
                  </pre>
                </div>
              )
            )}

            {error && (
              <div className="rounded bg-red-100 p-3 text-sm text-red-800">{error}</div>
            )}
          </div>
        </Card>

        {isLoading && (
          <Card className="p-4">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground">Daten werden geladen...</p>
            </div>
          </Card>
        )}

        {!isLoading && (
          <>
            <Card className="relative h-[600px] w-full overflow-hidden">
              <Map
                ref={mapRef}
                initialViewState={{
                  longitude: 7.0982, // Bonn
                  latitude: 50.7374,
                  zoom: 11, // Lower zoom to see larger shapes
                }}
                onLoad={() => {
                  // Wait a bit for map tiles to render before adding our layer
                  setTimeout(() => {
                    if (mapRef.current) {
                      const map = mapRef.current.getMap() as MapLibreMap
                      const setupDebugLayer = () => {
                        // Remove existing layer
                        if (debugLayerRef.current) {
                          if (map.getLayer(debugLayerRef.current.id)) {
                            map.removeLayer(debugLayerRef.current.id)
                          }
                          debugLayerRef.current = null
                        }

                        // Create and add new debug layer
                        const layer = new InfluenceDiskLayerDebug({
                          id: 'influence-disk-debug-layer',
                          stage: 3,
                        })

                        try {
                          map.addLayer(layer)
                          debugLayerRef.current = layer
                          map.triggerRepaint()
                        } catch (error) {
                          console.error('[DebugPage] Error adding debug layer from onLoad:', error)
                        }
                      }
                      setupDebugLayer()
                    }
                  }, 100) // Small delay to ensure map tiles render first
                }}
                mapStyle={
                  process.env.NEXT_PUBLIC_MAPTILER_API_KEY
                    ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}&lang=de`
                    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
                }
                style={{ width: '100%', height: '100%' }}
                reuseMaps={true}
              >
                {/* Debug layer is added via onLoad callback */}
              </Map>
              <div className="absolute top-2 right-2 rounded bg-white p-2 text-xs shadow-lg">
                <p>Radial Falloff Debug</p>
                <p>Features: {useTestData ? '8 (Debug Layer)' : realData?.features.length || 0}</p>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="mb-2 text-lg font-semibold">Debug-Informationen</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Hinweis:</strong> Öffne die Browser-Konsole (F12) für detaillierte Logs
                  der Layer-Rendering-Pipeline.
                </p>
                <div>
                  <p>Erwartete Logs:</p>
                  <ul className="ml-4 list-disc">
                    <li>[HeatmapMap] Data loaded: X features</li>
                    <li>[HeatmapMap] Setting up layer with X features</li>
                    <li>[InfluenceDiskLayer] onAdd called</li>
                    <li>[InfluenceDiskLayer] Shader programs created</li>
                    <li>[InfluenceDiskLayer] First render</li>
                    <li>[InfluenceDiskLayer] Render stats (gelegentlich)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/heatmap">Zur echten Heatmap</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Zur Startseite</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
