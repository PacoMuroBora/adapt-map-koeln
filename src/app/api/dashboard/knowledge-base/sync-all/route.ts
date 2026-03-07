import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { DASHBOARD_CACHE_TAGS } from '@/lib/dashboard-cache'
import { getPayloadClient } from '@/lib/payload'
import { triggerKBSync } from '@/utilities/triggerKBSync'

async function requireEditor(request: Request) {
  const payload = await getPayloadClient()
  const authResult = await payload.auth({
    headers: request.headers,
  } as PayloadRequest)
  const user = authResult.user as { roles?: string | string[] } | null
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean)
  if (!roles.includes('admin') && !roles.includes('editor')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { payload }
}

/**
 * POST: Sync all published KB items to the vector DB.
 * Re-syncs every published item (not only unsynced). Use for full refresh.
 */
export async function POST(request: Request) {
  const auth = await requireEditor(request)
  if (auth.error) return auth.error
  const { payload } = auth

  try {
    const allItems = await payload.find({
      collection: 'knowledge-base-items',
      limit: 10000,
      depth: 0,
      where: { status: { equals: 'published' } },
    })

    const synced: string[] = []
    const errors: string[] = []

    for (const item of allItems.docs) {
      try {
        await triggerKBSync('update', String(item.id), payload, {
          trigger: 'manual',
          updateMetadata: true,
        })
        synced.push(String(item.id))
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        const msg = `${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(msg)
        console.error(`KB sync error for ${item.id}:`, error)
      }
    }

    revalidateTag(DASHBOARD_CACHE_TAGS.kbList)
    revalidateTag(DASHBOARD_CACHE_TAGS.kbAnalytics)

    return NextResponse.json({
      message: `Sync completed. ${synced.length} items synced, ${errors.length} errors`,
      synced: synced.length,
      errors: errors.length > 0 ? errors : undefined,
      total: allItems.docs.length,
    })
  } catch (error) {
    console.error('Sync all KB items error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync all items',
      },
      { status: 500 },
    )
  }
}
