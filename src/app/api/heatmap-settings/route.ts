import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import type { SiteSetting } from '@/payload-types'

const DEFAULT_TILE_SIZE = 500
const DEFAULT_TILE_OPACITY = 0.35

export async function GET() {
  try {
    const payload = await getPayloadClient()
    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
    })) as SiteSetting | null
    const tileSizeMeters = settings?.heatmapTileSize ?? DEFAULT_TILE_SIZE
    const clamped = Math.max(50, Math.min(5000, Number(tileSizeMeters) || DEFAULT_TILE_SIZE))

    const tileOpacity = settings?.heatmapTileOpacity ?? DEFAULT_TILE_OPACITY
    const clampedOpacity = Math.max(0, Math.min(1, Number(tileOpacity) || DEFAULT_TILE_OPACITY))

    const mapCenter = settings?.mapCenter
      ? {
          lat: settings.mapCenter.lat ?? 50.9375,
          lng: settings.mapCenter.lng ?? 6.9603,
          zoom: settings.mapCenter.zoom ?? 10,
        }
      : { lat: 50.9375, lng: 6.9603, zoom: 10 }

    return NextResponse.json({ tileSizeMeters: clamped, tileOpacity: clampedOpacity, mapCenter })
  } catch (e) {
    console.error('heatmap-settings error:', e)
    return NextResponse.json({
      tileSizeMeters: DEFAULT_TILE_SIZE,
      tileOpacity: DEFAULT_TILE_OPACITY,
      mapCenter: { lat: 50.9375, lng: 6.9603, zoom: 10 },
    })
  }
}
