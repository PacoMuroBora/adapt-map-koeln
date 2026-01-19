import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@payload-config'
import type { PayloadRequest } from 'payload'
import { getN8nWebhookUrl } from '@/utilities/getN8nWebhookUrl'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })

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

    // Parse request body
    const body = await request.json()
    const { kbItemId } = body

    if (!kbItemId) {
      return NextResponse.json({ error: 'Missing kbItemId in request body' }, { status: 400 })
    }

    // Verify the KB item exists
    const kbItem = await payload.findByID({
      collection: 'knowledge-base-items',
      id: String(kbItemId),
      depth: 0,
    })

    if (!kbItem) {
      return NextResponse.json({ error: 'Knowledge Base item not found' }, { status: 404 })
    }

    // Trigger sync via n8n webhook
    const webhookUrl = await getN8nWebhookUrl('kbSync')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update', // Use 'update' to trigger sync check
        kbItemId: String(kbItemId),
        trigger: 'manual',
      }),
    })

    // Wait for response body to ensure request is fully processed
    const responseText = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Sync failed: ${response.status} ${response.statusText}`,
          details: responseText,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Sync triggered successfully',
      kbItemId: String(kbItemId),
      response: responseText,
    })
  } catch (error) {
    console.error('Sync KB item error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to trigger sync',
      },
      { status: 500 },
    )
  }
}
