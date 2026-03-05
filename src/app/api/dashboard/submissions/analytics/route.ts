import { NextResponse } from 'next/server'
import type { PayloadRequest } from 'payload'

import { getCachedSubmissionsAnalytics } from '@/lib/dashboard-cache'
import { getPayloadClient } from '@/lib/payload'
import type { Submission } from '@/payload-types'

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

    const result = await getCachedSubmissionsAnalytics(range)
    const docs = result.docs as Submission[]

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

