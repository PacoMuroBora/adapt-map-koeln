import { NextResponse, type NextRequest } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getCachedSubmissionById } from '@/lib/dashboard-cache'
import { getPayloadClient } from '@/lib/payload'
import type { Submission } from '@/payload-types'

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

    const doc = (await getCachedSubmissionById(id)) as Submission

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

