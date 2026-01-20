import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { PayloadRequest } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { triggerKBSync } from '@/utilities/triggerKBSync'

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()

    // Check authentication via cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Verify user is authenticated
    let user
    try {
      const authResult = await payload.auth({
        headers: request.headers,
      } as PayloadRequest)
      user = authResult.user
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or editor role
    const userRoles = user.roles || []
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Editor access required' },
        { status: 403 },
      )
    }

    // Find all items - we'll filter for unsynced items in code
    // This avoids MongoDB casting issues with nested group fields
    const allItems = await payload.find({
      collection: 'knowledge-base-items',
      limit: 10000, // Adjust if needed
      depth: 0,
      select: {
        id: true,
        status: true,
        'embeddingMetadata.last_synced': true,
      },
    })

    // Filter for items without last_synced
    // Handle cases where embeddingMetadata might be null, undefined, empty object, or empty string
    const unsyncedItems = {
      docs: allItems.docs.filter((item: any) => {
        const lastSynced = item.embeddingMetadata?.last_synced
        return !lastSynced || lastSynced === null || lastSynced === undefined
      }),
      totalDocs: 0, // Will be set below
    }
    unsyncedItems.totalDocs = unsyncedItems.docs.length

    const synced: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    // Trigger sync for each unsynced item sequentially (one at a time)
    for (const item of unsyncedItems.docs) {
      try {
        // Only sync published items (matching the hook behavior)
        if (item.status !== 'published') {
          skipped.push(`${item.id} (status: ${item.status})`)
          continue
        }

        // Trigger sync via shared utility - wait for completion
        await triggerKBSync('update', String(item.id), payload, {
          trigger: 'manual',
          updateMetadata: true,
        })

        synced.push(String(item.id))
        console.log(`KB sync successful for ${item.id}`)

        // Small delay between requests to avoid overwhelming n8n
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        const errorMsg = `${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(`KB sync error for ${item.id}:`, error)
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${synced.length} items synced, ${skipped.length} skipped, ${errors.length} errors`,
      synced: synced.length,
      skipped: skipped.length,
      errors: errors.length > 0 ? errors : undefined,
      total: unsyncedItems.totalDocs,
    })
  } catch (error) {
    console.error('Sync unsynced items error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync unsynced items',
      },
      { status: 500 },
    )
  }
}
