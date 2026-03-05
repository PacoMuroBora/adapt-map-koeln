import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import type { KnowledgeBaseItem } from '@/payload-types'

type RouteParams = {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
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

    const doc = (await payload.findByID({
      collection: 'knowledge-base-items',
      id: params.id,
      depth: 0,
      overrideAccess: true,
    })) as KnowledgeBaseItem

    return NextResponse.json({ doc })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to load knowledge base item' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
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
      id: params.id,
      data: body,
      overrideAccess: true,
    })

    return NextResponse.json({ doc: updated })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update knowledge base item' },
      { status: 500 },
    )
  }
}

