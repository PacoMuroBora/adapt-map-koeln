import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import type { KnowledgeBaseItem } from '@/payload-types'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const search = (url.searchParams.get('q') ?? '').toLowerCase()

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
      collection: 'knowledge-base-items',
      depth: 0,
      limit: 100,
      sort: '-createdAt',
      overrideAccess: true,
    })

    const docs = result.docs as KnowledgeBaseItem[]

    const filtered = docs.filter((doc) => {
      if (!search) return true
      const title = doc.displayTitle?.toLowerCase() ?? ''
      const theme = (doc.theme as string | undefined)?.toLowerCase() ?? ''
      const location = doc.location?.toLowerCase() ?? ''
      return (
        title.includes(search) ||
        theme.includes(search) ||
        location.includes(search) ||
        String(doc.solution_type ?? '').toLowerCase().includes(search)
      )
    })

    const items = filtered.map((doc) => ({
      id: doc.id,
      displayTitle: doc.displayTitle,
      theme: doc.theme,
      solution_type: doc.solution_type,
      status: doc.status,
      location: doc.location,
      lastSynced: doc.embeddingMetadata?.last_synced ?? null,
    }))

    return NextResponse.json({
      docs: items,
      totalDocs: filtered.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to load knowledge base items' },
      { status: 500 },
    )
  }
}

