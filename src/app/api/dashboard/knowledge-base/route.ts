import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import type { KnowledgeBaseItem } from '@/payload-types'

async function requireEditor(request: Request) {
  const payload = await getPayloadClient()
  const authResult = await payload.auth({
    headers: request.headers,
  } as PayloadRequest)
  const user = authResult.user as any
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (user.roles !== 'admin' && user.roles !== 'editor') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { payload }
}

export async function POST(request: Request) {
  const auth = await requireEditor(request)
  if (auth.error) return auth.error
  const { payload } = auth
  try {
    const body = await request.json()
    const doc = await payload.create({
      collection: 'knowledge-base-items',
      data: body,
      overrideAccess: true,
    })
    return NextResponse.json({ doc })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create knowledge base item' },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if (auth.error) return auth.error
  const { payload } = auth
  try {
    const url = new URL(request.url)
    const search = (url.searchParams.get('q') ?? '').toLowerCase()

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
      link: doc.link ?? null,
      categories: doc.categories ?? [],
      lastSynced: doc.embeddingMetadata?.last_synced ?? null,
      createdAt: (doc as any).createdAt ?? null,
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

