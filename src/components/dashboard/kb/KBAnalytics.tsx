'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'

type RangeKey = '7d' | '30d' | '180d' | '365d'

type AnalyticsResponse = {
  range: RangeKey
  totalEvents: number
  timeSeries: { date: string; count: number }[]
  byItem: { label: string; value: number }[]
  byTheme: { label: string; value: number }[]
  byCategory: { label: string; value: number }[]
}

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': '1W',
  '30d': '1M',
  '180d': '6M',
  '365d': '1J',
}

export function KBAnalytics() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'items' | 'themes' | 'categories'>('items')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await dashboardFetch<AnalyticsResponse>(
          `/api/dashboard/knowledge-base/analytics?range=${range}`,
          { method: 'GET' },
        )
        setData(res)
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der KB-Analytics')
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [range])

  const bars =
    tab === 'items'
      ? data?.byItem ?? []
      : tab === 'themes'
        ? data?.byTheme ?? []
        : data?.byCategory ?? []

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="flex h-full flex-col rounded-3xl border border-border bg-am-dark text-am-white">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
              Empfehlungen über Zeit
            </CardTitle>
            <p className="text-xs text-foreground-alt">
              {data ? `${data.totalEvents} Recommendation-Events` : 'Lade…'}
            </p>
          </div>
          <div className="flex gap-1">
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
        <CardContent className="flex flex-1 flex-col justify-between pb-4">
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
              <div className="flex items-baseline justify-between text-xs">
                <div className="space-y-1">
                  <p className="text-foreground-alt">Empfehlungen insgesamt</p>
                  <p className="text-2xl font-semibold text-am-purple-alt">
                    {data.totalEvents}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-32 rounded-2xl bg-gradient-to-t from-am-turq/10 to-am-turq/30 p-3">
                <div className="flex h-full items-end gap-1">
                  {data.timeSeries.map((point) => {
                    const maxCount = Math.max(...data.timeSeries.map((p) => p.count), 1)
                    const h = (point.count / maxCount) * 100
                    return (
                      <div
                        key={point.date}
                        className="flex-1 rounded-full bg-am-turq-alt/50"
                        style={{ height: `${Math.max(h, 8)}%` }}
                        title={`${point.date}: ${point.count} Empfehlungen`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col rounded-3xl border border-border bg-am-dark text-am-white">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
              Häufig empfohlene Inhalte
            </CardTitle>
            <p className="text-xs text-foreground-alt">
              Top-Empfehlungen nach KB-Item, Thema oder Kategorie
            </p>
          </div>
          <div className="inline-flex gap-1 rounded-full bg-am-darker/80 p-1">
            <Button
              size="tiny"
              shape="round"
              variant={tab === 'items' ? 'default' : 'ghost-muted'}
              className="px-2 text-[10px]"
              onClick={() => setTab('items')}
            >
              Items
            </Button>
            <Button
              size="tiny"
              shape="round"
              variant={tab === 'themes' ? 'default' : 'ghost-muted'}
              className="px-2 text-[10px]"
              onClick={() => setTab('themes')}
            >
              Themen
            </Button>
            <Button
              size="tiny"
              shape="round"
              variant={tab === 'categories' ? 'default' : 'ghost-muted'}
              className="px-2 text-[10px]"
              onClick={() => setTab('categories')}
            >
              Kategorien
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-4">
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
            <div className="flex flex-1 flex-col gap-2">
              {bars.map((row) => {
                const max = Math.max(...bars.map((b) => b.value), 1)
                const width = (row.value / max) * 100
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-foreground-alt">
                      <span className="truncate">{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                    <div className="h-5 overflow-hidden rounded-full bg-am-darker/80">
                      <div
                        className="flex h-full items-center rounded-full bg-am-turq-alt/80 px-3 text-[10px] text-am-white"
                        style={{ width: `${Math.max(width, 8)}%` }}
                      >
                        {row.value} Empfehlungen
                      </div>
                    </div>
                  </div>
                )
              })}
              {bars.length === 0 && (
                <p className="mt-4 text-xs text-foreground-alt">
                  Noch keine Recommendation-Events im gewählten Zeitraum.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

