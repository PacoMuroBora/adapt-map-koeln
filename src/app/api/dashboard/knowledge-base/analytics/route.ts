import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getCachedKnowledgeBaseAnalytics } from '@/lib/dashboard-cache'
import { getPayloadClient } from '@/lib/payload'

type RangeKey = '7d' | '30d' | '180d' | '365d'

function parseRange(param: string | null): RangeKey {
  if (param === '30d' || param === '180d' || param === '365d') return param
  return '7d'
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const range = parseRange(url.searchParams.get('range'))

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

    const result = await getCachedKnowledgeBaseAnalytics(range)
    const docs = result.docs as any[]

    const byDay = new Map<string, { date: string; count: number }>()
    const byItem = new Map<string, number>()
    const byTheme = new Map<string, number>()
    const byCategory = new Map<string, number>()

    for (const doc of docs) {
      const ts = doc.recommendedAt
      const d = ts ? new Date(ts) : null
      const dayKey = d ? d.toISOString().slice(0, 10) : 'unknown'

      const existing = byDay.get(dayKey) || { date: dayKey, count: 0 }
      existing.count += 1
      byDay.set(dayKey, existing)

      const kbId = String(doc.kbItem)
      byItem.set(kbId, (byItem.get(kbId) ?? 0) + 1)

      if (doc.theme) {
        byTheme.set(String(doc.theme), (byTheme.get(String(doc.theme)) ?? 0) + 1)
      }

      if (Array.isArray(doc.categories)) {
        for (const c of doc.categories) {
          if (c?.value) {
            const key = String(c.value)
            byCategory.set(key, (byCategory.get(key) ?? 0) + 1)
          }
        }
      }
    }

    const timeSeries = Array.from(byDay.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        date: entry.date,
        count: entry.count,
      }))

    const top = (map: Map<string, number>, limit = 5) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, value]) => ({ label, value }))

    return NextResponse.json({
      range,
      totalEvents: docs.length,
      timeSeries,
      byItem: top(byItem),
      byTheme: top(byTheme),
      byCategory: top(byCategory),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to load KB analytics' },
      { status: 500 },
    )
  }
}

