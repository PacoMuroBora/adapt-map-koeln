import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import type { Submission } from '@/payload-types'

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
      collection: 'submissions',
      id: params.id,
      depth: 0,
      overrideAccess: true,
    })) as Submission

    return NextResponse.json({ doc })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message ?? 'Failed to load submission',
      },
      { status: 500 },
    )
  }
}

