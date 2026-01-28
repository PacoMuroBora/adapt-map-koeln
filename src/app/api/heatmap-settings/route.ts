import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import type { SiteSetting } from '@/payload-types'

const DEFAULT_TILE_SIZE = 500

export async function GET() {
  try {
    const payload = await getPayloadClient()
    const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as SiteSetting | null
    const tileSizeMeters = settings?.heatmapTileSize ?? DEFAULT_TILE_SIZE
    const clamped = Math.max(50, Math.min(5000, Number(tileSizeMeters) || DEFAULT_TILE_SIZE))
    return NextResponse.json({ tileSizeMeters: clamped })
  } catch (e) {
    console.error('heatmap-settings error:', e)
    return NextResponse.json({ tileSizeMeters: DEFAULT_TILE_SIZE })
  }
}
