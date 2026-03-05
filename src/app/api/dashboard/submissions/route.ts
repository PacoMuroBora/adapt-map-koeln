import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import type { Submission } from '@/payload-types'

type ListQuery = {
  limit?: number
  page?: number
}

function parseListQuery(searchParams: URLSearchParams): ListQuery {
  const limit = Number(searchParams.get('limit') ?? '20')
  const page = Number(searchParams.get('page') ?? '1')

  return {
    limit: Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 20,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const { limit, page } = parseListQuery(url.searchParams)

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

    const result = await payload.find({
      collection: 'submissions',
      depth: 0,
      limit,
      page,
      sort: '-createdAt',
      // Admin/editor-only dashboard, so we intentionally bypass collection access control.
      overrideAccess: true,
    })

    const items = (result.docs as Submission[]).map((doc) => ({
      id: doc.id,
      createdAt: (doc as any).createdAt,
      problemIndex: doc.problem_index,
      heatFrequency: doc.heatFrequency,
      heatIntensity: doc.heatIntensity,
      postalCode: doc.location.postal_code,
      city: doc.location.city,
      questionnaireVersion: doc.questionnaireVersion,
      desiredChanges: Array.isArray(doc.desiredChanges)
        ? doc.desiredChanges.map((d) => d.icon)
        : [],
      aiGeneratedAt: doc.aiFields?.ai_generated_at ?? null,
    }))

    return NextResponse.json({
      docs: items,
      page: result.page,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message ?? 'Failed to load submissions',
      },
      { status: 500 },
    )
  }
}

