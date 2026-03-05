import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'

type RouteParams = {
  params: {
    slug: string
  }
}

const ALLOWED_SLUGS = new Set(['site-settings', 'ui-copy'] as const)

function assertAllowed(slug: string): asserts slug is 'site-settings' | 'ui-copy' {
  if (!ALLOWED_SLUGS.has(slug as any)) {
    throw new Error('Unsupported global slug')
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const slug = params.slug
    assertAllowed(slug)

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

    const doc = await payload.findGlobal({
      slug,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ doc })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to load global' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const slug = params.slug
    assertAllowed(slug)

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

    const updated = await payload.updateGlobal({
      slug,
      data: body,
      overrideAccess: true,
    })

    return NextResponse.json({ doc: updated })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update global' },
      { status: 500 },
    )
  }
}

