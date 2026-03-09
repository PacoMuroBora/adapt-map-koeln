'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'
import { cn } from '@/utilities/ui'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

export type KBChartVariant = 'time' | 'distribution' | 'both'

export function KBAnalytics({ chart = 'both' }: { chart?: KBChartVariant }) {
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

  const distributionYAxisLabel =
    tab === 'items' ? 'KB-Item' : tab === 'themes' ? 'Thema' : 'Kategorie'

  const showTime = chart === 'time' || chart === 'both'
  const showDistribution = chart === 'distribution' || chart === 'both'

  return (
    <div className={cn('h-full', showTime && showDistribution && 'grid grid-cols-1 gap-6 md:grid-cols-2')}>
      {showTime && (
      <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow">
        <CardHeader className="pb-4 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold tracking-title uppercase">
              Empfehlungen über Zeit
            </CardTitle>
            <div className="flex gap-2 rounded-full bg-am-white/70 p-1">
              {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
                <Button
                  key={key}
                  variant={key === range ? 'pill' : 'ghost-muted'}
                  size="tiny"
                  shape="round"
                  className="px-2 text-base"
                  onClick={() => setRange(key)}
                >
                  {RANGE_LABEL[key]}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-base text-foreground-alt">
            {data ? `${data.totalEvents} Recommendation-Events` : 'Lade…'}
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between pb-5">
          {/* While reloading with existing data, keep showing the old chart.
              Only show the empty placeholder when we have never loaded data yet. */}
          {loading && !data && <div className="flex-1" />}
          {error && !loading && !data && (
            <div className="flex flex-1 items-center justify-center text-base text-destructive">
              {error}
            </div>
          )}
          {data && !error && (
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-baseline justify-between text-base">
                <div className="space-y-1">
                  <p className="text-foreground-alt">Empfehlungen insgesamt</p>
                  <p className="text-3xl font-semibold text-am-purple-alt">
                    {data.totalEvents}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-36 rounded-2xl bg-gradient-to-t from-am-turq/10 to-am-turq/30 pl-3 pr-3 pt-2 pb-1">
                {data.timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={144}>
                    <LineChart
                      data={data.timeSeries}
                      // Minimal but readable padding around plot area
                      margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                    >
                      {/* Hide X axis; show only simple numeric Y ticks */}
                      <XAxis dataKey="date" hide />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={32}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${value} Empfehlungen`, 'Anzahl']}
                        labelFormatter={(label: any) =>
                          new Date(label).toLocaleDateString('de-DE')
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--am-turq-alt))"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          strokeWidth: 1,
                          stroke: 'hsl(var(--am-turq-alt))',
                          fill: 'white',
                        }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-base text-foreground-alt">
                    Keine Daten im Zeitraum
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {showDistribution && (
      <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow">
        <CardHeader className="pb-4 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold tracking-title uppercase">
              Top-Empfehlungen
            </CardTitle>
            <div className="inline-flex gap-1 rounded-full bg-am-white/70 p-1">
              <Button
                size="tiny"
                shape="round"
                variant={tab === 'items' ? 'pill' : 'ghost-muted'}
                className="px-2 text-base"
                onClick={() => setTab('items')}
              >
                Items
              </Button>
              <Button
                size="tiny"
                shape="round"
                variant={tab === 'themes' ? 'pill' : 'ghost-muted'}
                className="px-2 text-base"
                onClick={() => setTab('themes')}
              >
                Themen
              </Button>
              <Button
                size="tiny"
                shape="round"
                variant={tab === 'categories' ? 'pill' : 'ghost-muted'}
                className="px-2 text-base"
                onClick={() => setTab('categories')}
              >
                Kategorien
              </Button>
            </div>
          </div>
          <p className="text-base text-foreground-alt">
            Top-Empfehlungen nach KB-Item, Thema oder Kategorie
          </p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-5">
          {/* Same behavior as time-series card: keep showing existing data while reloading. */}
          {loading && !data && <div className="flex-1" />}
          {error && !loading && !data && (
            <div className="flex flex-1 items-center justify-center text-base text-destructive">
              {error}
            </div>
          )}
          {data && !error && (
            <div className="flex flex-1 flex-col gap-2">
              {bars.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <BarChart
                    data={bars}
                    layout="vertical"
                    // No axis labels → remove extra bottom space
                    margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                  >
                    {/* Hide numeric axis; keep only bars and tooltips */}
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} Empfehlungen`, 'Anzahl']}
                      labelFormatter={(label: any) => label}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--am-turq-alt))"
                      radius={999}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="mt-4 text-base text-foreground-alt">
                  Noch keine Recommendation-Events im gewählten Zeitraum.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  )
}

