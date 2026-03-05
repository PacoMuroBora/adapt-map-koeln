import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getCachedSubmissionsAnalytics } from '@/lib/dashboard-cache'
import { getPayloadClient } from '@/lib/payload'
import type { Submission } from '@/payload-types'

type RangeKey = '7d' | '30d' | '180d' | '365d'

type FilterTimeRange = 'all' | '7d' | '30d' | '90d'

function parseRange(param: string | null): RangeKey {
  if (param === '30d' || param === '180d' || param === '365d') return param
  return '7d'
}

function parseFilterTimeRange(param: string | null): FilterTimeRange {
  if (param === '7d' || param === '30d' || param === '90d') return param
  return 'all'
}

function applyListFilters(
  docs: Submission[],
  search: string,
  filterTimeRange: FilterTimeRange,
  location: string,
): Submission[] {
  let out = docs

  const term = search.trim().toLowerCase()
  if (term) {
    out = out.filter((doc) => {
      const id = (doc.id ?? '').toString().toLowerCase()
      const postal = (doc.location?.postal_code ?? '').toLowerCase()
      const city = (doc.location?.city ?? '').toLowerCase()
      return id.includes(term) || postal.includes(term) || city.includes(term)
    })
  }

  if (filterTimeRange !== 'all') {
    const now = Date.now()
    const days = filterTimeRange === '7d' ? 7 : filterTimeRange === '30d' ? 30 : 90
    const cutoff = now - days * 24 * 60 * 60 * 1000
    out = out.filter((doc) => {
      const ts = doc.metadata?.timestamp ?? (doc as { createdAt?: string }).createdAt
      return ts ? new Date(ts).getTime() >= cutoff : false
    })
  }

  const loc = location.trim().toLowerCase()
  if (loc) {
    out = out.filter((doc) => {
      const postal = (doc.location?.postal_code ?? '').toLowerCase()
      const city = (doc.location?.city ?? '').toLowerCase()
      return postal.includes(loc) || city.includes(loc)
    })
  }

  return out
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const range = parseRange(url.searchParams.get('range'))
    const search = url.searchParams.get('search') ?? ''
    const filterTimeRange = parseFilterTimeRange(url.searchParams.get('filterTimeRange'))
    const location = url.searchParams.get('location') ?? ''

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

    const result = await getCachedSubmissionsAnalytics(range)
    let docs = result.docs as Submission[]
    docs = applyListFilters(docs, search, filterTimeRange, location)

    // Time series by day
    const byDay = new Map<string, { date: string; count: number; avgProblemIndex: number }>()

    // Distributions
    const byPostalCode = new Map<string, number>()
    const byHeatFrequency = new Map<string, number>()
    const byDesiredChange = new Map<string, number>()

    let withAi = 0

    for (const doc of docs) {
      const ts = doc.metadata?.timestamp || (doc as any).createdAt
      const d = ts ? new Date(ts) : null
      const dayKey = d ? d.toISOString().slice(0, 10) : 'unknown'

      const existing = byDay.get(dayKey) || {
        date: dayKey,
        count: 0,
        avgProblemIndex: 0,
      }
      existing.count += 1
      existing.avgProblemIndex += (doc.problem_index ?? 0) as number
      byDay.set(dayKey, existing)

      const postal = doc.location?.postal_code
      if (postal) {
        byPostalCode.set(postal, (byPostalCode.get(postal) ?? 0) + 1)
      }

      const hf = doc.heatFrequency
      if (hf) {
        byHeatFrequency.set(hf, (byHeatFrequency.get(hf) ?? 0) + 1)
      }

      if (Array.isArray(doc.desiredChanges)) {
        for (const change of doc.desiredChanges) {
          const icon = change?.icon
          if (icon) {
            byDesiredChange.set(icon, (byDesiredChange.get(icon) ?? 0) + 1)
          }
        }
      }

      if (doc.aiFields?.ai_summary_de) {
        withAi += 1
      }
    }

    const timeSeries = Array.from(byDay.values())
      .map((entry) => ({
        date: entry.date,
        count: entry.count,
        avgProblemIndex: entry.count > 0 ? entry.avgProblemIndex / entry.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const top = (map: Map<string, number>, limit = 5) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, value]) => ({ label, value }))

    const totalDocs = docs.length

    return NextResponse.json({
      range,
      totalDocs,
      withAi,
      timeSeries,
      byPostalCode: top(byPostalCode),
      byHeatFrequency: top(byHeatFrequency),
      byDesiredChange: top(byDesiredChange),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message ?? 'Failed to load analytics',
      },
      { status: 500 },
    )
  }
}

