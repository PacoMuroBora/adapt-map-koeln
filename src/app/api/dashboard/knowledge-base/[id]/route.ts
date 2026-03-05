import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import type { PayloadRequest } from 'payload'

import { DASHBOARD_CACHE_TAGS, getCachedKnowledgeBaseItemById } from '@/lib/dashboard-cache'
import { getPayloadClient } from '@/lib/payload'
import type { KnowledgeBaseItem } from '@/payload-types'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const payload = await getPayloadClient()

    const authResult = await payload.auth({
      headers: request.headers,
    } as PayloadRequest)

    const user = authResult.user as any

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = user.roles
    if (roles !== 'admin' && roles !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const doc = (await getCachedKnowledgeBaseItemById(id)) as KnowledgeBaseItem

    return NextResponse.json({ doc })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to load knowledge base item' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const body = await request.json()

    const payload = await getPayloadClient()

    const authResult = await payload.auth({
      headers: request.headers,
    } as PayloadRequest)

    const user = authResult.user as any

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = user.roles
    if (roles !== 'admin' && roles !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await payload.update({
      collection: 'knowledge-base-items',
      id,
      data: body,
      overrideAccess: true,
    })

    revalidateTag(DASHBOARD_CACHE_TAGS.kbList)
    revalidateTag(DASHBOARD_CACHE_TAGS.kbDoc(id))
    revalidateTag(DASHBOARD_CACHE_TAGS.kbAnalytics)
    return NextResponse.json({ doc: updated })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update knowledge base item' },
      { status: 500 },
    )
  }
}

