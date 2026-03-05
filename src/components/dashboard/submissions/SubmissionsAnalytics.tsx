'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

type FilterTimeRange = 'all' | '7d' | '30d' | '90d'

interface SubmissionsAnalyticsProps {
  search?: string
  filterTimeRange?: FilterTimeRange
  filterLocation?: string
}

export function SubmissionsAnalytics({
  search = '',
  filterTimeRange = 'all',
  filterLocation = '',
}: SubmissionsAnalyticsProps = {}) {
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
        const params = new URLSearchParams({ range })
        if (search.trim()) params.set('search', search.trim())
        if (filterTimeRange !== 'all') params.set('filterTimeRange', filterTimeRange)
        if (filterLocation.trim()) params.set('location', filterLocation.trim())
        const res = await dashboardFetch<AnalyticsResponse>(
          `/api/dashboard/submissions/analytics?${params.toString()}`,
          { method: 'GET' },
        )
        setData(res)
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der Analytics')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [range, search, filterTimeRange, filterLocation])

  const aiRate =
    data && data.totalDocs > 0 ? Math.round((data.withAi / data.totalDocs) * 100) : 0

  const bars =
    tab === 'postal'
      ? data?.byPostalCode ?? []
      : tab === 'heat'
        ? data?.byHeatFrequency ?? []
        : data?.byDesiredChange ?? []

  const distributionYAxisLabel =
    tab === 'postal' ? 'PLZ' : tab === 'heat' ? 'Hitzekategorie' : 'Wunsch-Typ'

  return (
    <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
      {/* Line chart card (time series) */}
      <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow">
        <CardHeader className="pb-4 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold tracking-title uppercase">
              Aktivität nach Zeit
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
                  <p className="text-foreground-alt">Anzahl</p>
                  <p className="text-3xl font-semibold text-foreground-alt">
                    {data.totalDocs}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-foreground-alt">Ø Problemindex</p>
                  <p className="text-3xl font-semibold text-foreground">
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

              <div className="mt-4 h-36 rounded-2xl bg-gradient-to-t from-am-purple/10 to-am-purple/30 pl-3 pr-3 pt-2 pb-1">
                {data.timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
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
                        formatter={(value: any) => [`${value} Submissions`, 'Anzahl']}
                        labelFormatter={(label: any) =>
                          new Date(label).toLocaleDateString('de-DE')
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--am-purple-alt))"
                        strokeWidth={2}
                        dot={{
                          r: 3,
                          strokeWidth: 1,
                          stroke: 'hsl(var(--am-purple-alt))',
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

      {/* Horizontal bars card */}
      <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow">
        <CardHeader className="pb-4 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold tracking-title uppercase">
                Verteilung
              </CardTitle>
            </div>
            <div className="inline-flex gap-1 rounded-full bg-am-white/70 p-1">
              <Button
                size="tiny"
                shape="round"
                variant={tab === 'postal' ? 'pill' : 'ghost-muted'}
                className="px-2 text-base"
                onClick={() => setTab('postal')}
              >
                PLZ
              </Button>
              <Button
                size="tiny"
                shape="round"
                variant={tab === 'heat' ? 'pill' : 'ghost-muted'}
                className="px-2 text-base"
                onClick={() => setTab('heat')}
              >
                Hitze
              </Button>
              <Button
                size="tiny"
                shape="round"
                variant={tab === 'desired' ? 'pill' : 'ghost-muted'}
                className="px-2 text-base"
                onClick={() => setTab('desired')}
              >
                Wünsche
              </Button>
            </div>
          </div>
          <p className="text-base text-foreground-alt">
            Top Segmente im gewählten Zeitraum
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
            <div className="flex flex-1 flex-col gap-3">
              {bars.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                      width={70}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(label: string) =>
                        tab === 'desired' ? label.replace('_', ' ') : label
                      }
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} Submissions`, 'Anzahl']}
                      labelFormatter={(label: any) =>
                        tab === 'desired' ? String(label).replace('_', ' ') : label
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--am-purple-alt))"
                      radius={999}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="mt-4 text-base text-foreground-alt">
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

