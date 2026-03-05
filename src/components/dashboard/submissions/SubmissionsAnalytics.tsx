'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'

type RangeKey = '7d' | '30d' | '180d' | '365d'

type AnalyticsResponse = {
  range: RangeKey
  totalDocs: number
  withAi: number
  timeSeries: { date: string; count: number; avgProblemIndex: number }[]
  byPostalCode: { label: string; value: number }[]
  byHeatFrequency: { label: string; value: number }[]
  byDesiredChange: { label: string; value: number }[]
}

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': '1W',
  '30d': '1M',
  '180d': '6M',
  '365d': '1J',
}

export function SubmissionsAnalytics() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'postal' | 'heat' | 'desired'>('postal')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await dashboardFetch<AnalyticsResponse>(
          `/api/dashboard/submissions/analytics?range=${range}`,
          { method: 'GET' },
        )
        setData(res)
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der Analytics')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [range])

  const aiRate =
    data && data.totalDocs > 0 ? Math.round((data.withAi / data.totalDocs) * 100) : 0

  const bars =
    tab === 'postal'
      ? data?.byPostalCode ?? []
      : tab === 'heat'
        ? data?.byHeatFrequency ?? []
        : data?.byDesiredChange ?? []

  return (
    <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
      {/* Line chart card (time series) */}
      <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-[0.16em] uppercase">
              Aktivität nach Zeit
            </CardTitle>
            <p className="text-sm text-foreground-alt">
              {data ? `${data.totalDocs} Submissions im ausgewählten Zeitraum` : 'Lade…'}
            </p>
          </div>
          <div className="flex gap-2 bg-am-white/70 rounded-full px-2 py-1">
            {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
              <Button
                key={key}
                variant={key === range ? 'default' : 'ghost-muted'}
                size="tiny"
                shape="round"
                className="px-2 text-[10px]"
                onClick={() => setRange(key)}
              >
                {RANGE_LABEL[key]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between pb-5">
          {loading && (
            <div className="flex flex-1 flex-col justify-end gap-3">
              <Skeleton className="h-32 w-full rounded-2xl bg-am-darker/60" />
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-1 items-center justify-center text-xs text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && data && (
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-baseline justify-between text-sm">
                <div className="space-y-1">
                  <p className="text-foreground-alt">Ø Problemindex</p>
                  <p className="text-3xl font-semibold text-am-green-alt">
                    {data.timeSeries.length
                      ? Math.round(
                          data.timeSeries.reduce((sum, d) => sum + d.avgProblemIndex, 0) /
                            data.timeSeries.length,
                        )
                      : 0}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-foreground-alt">KI-Empfehlungen</p>
                  <p className="text-3xl font-semibold text-am-purple-alt">{aiRate}%</p>
                </div>
              </div>
              <div className="mt-5 h-32 rounded-2xl bg-gradient-to-t from-am-purple/10 to-am-purple/30 p-3">
                {/* Lightweight faux line chart using CSS heights */}
                <div className="flex h-full items-end gap-1">
                  {data.timeSeries.map((point) => {
                    const maxCount = Math.max(...data.timeSeries.map((p) => p.count), 1)
                    const h = (point.count / maxCount) * 100
                    return (
                      <div
                        key={point.date}
                        className="flex-1 rounded-full bg-am-purple-alt/40"
                        style={{ height: `${Math.max(h, 8)}%` }}
                        title={`${point.date}: ${point.count} Submissions`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horizontal bars card */}
      <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-[0.16em] uppercase">
              Verteilung
            </CardTitle>
            <p className="text-sm text-foreground-alt">
              Top Segmente im gewählten Zeitraum
            </p>
          </div>
          <div className="inline-flex gap-1 rounded-full bg-am-white/70 p-1">
            <Button
              size="tiny"
              shape="round"
              variant={tab === 'postal' ? 'default' : 'ghost-muted'}
              className="px-2 text-[10px]"
              onClick={() => setTab('postal')}
            >
              PLZ
            </Button>
            <Button
              size="tiny"
              shape="round"
              variant={tab === 'heat' ? 'default' : 'ghost-muted'}
              className="px-2 text-[10px]"
              onClick={() => setTab('heat')}
            >
              Hitze
            </Button>
            <Button
              size="tiny"
              shape="round"
              variant={tab === 'desired' ? 'default' : 'ghost-muted'}
              className="px-2 text-[10px]"
              onClick={() => setTab('desired')}
            >
              Wünsche
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-5">
          {loading && (
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-full rounded-full bg-am-darker/60" />
              <Skeleton className="h-6 w-full rounded-full bg-am-darker/60" />
              <Skeleton className="h-6 w-3/4 rounded-full bg-am-darker/60" />
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-1 items-center justify-center text-xs text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="flex flex-1 flex-col gap-3">
              {bars.map((row) => {
                const max = Math.max(...bars.map((b) => b.value), 1)
                const width = (row.value / max) * 100
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm text-foreground-alt">
                      <span className="truncate">
                        {tab === 'desired' ? row.label.replace('_', ' ') : row.label}
                      </span>
                      <span>{row.value}</span>
                    </div>
                    <div className="h-5 overflow-hidden rounded-full bg-secondary/60">
                      <div
                        className="flex h-full items-center rounded-full bg-am-purple-alt/80 px-3 text-xs text-am-dark"
                        style={{ width: `${Math.max(width, 8)}%` }}
                      >
                        {row.value} Submissions
                      </div>
                    </div>
                  </div>
                )
              })}
              {bars.length === 0 && (
                <p className="mt-4 text-xs text-foreground-alt">
                  Keine Daten für den aktuellen Zeitraum.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

