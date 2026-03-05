'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'
import { cn } from '@/utilities/ui'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type SubmissionListItem = {
  id: string
  createdAt: string
  problemIndex: number
  heatFrequency: string
  heatIntensity: number
  postalCode: string
  city?: string | null
  questionnaireVersion: string
  desiredChanges: string[]
  aiGeneratedAt: string | null
}

type ListResponse = {
  docs: SubmissionListItem[]
  page: number
  totalPages: number
  totalDocs: number
}

interface SubmissionsListProps {
  onSelect: (submission: SubmissionListItem) => void
}

export function SubmissionsList({ onSelect }: SubmissionsListProps) {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailJson, setDetailJson] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await dashboardFetch<ListResponse>('/api/dashboard/submissions?limit=50', {
          method: 'GET',
        })
        setData(res)
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der Submissions')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filtered =
    data?.docs.filter((item) => {
      if (!search.trim()) return true
      const term = search.toLowerCase()
      return (
        item.id.toLowerCase().includes(term) ||
        item.postalCode.toLowerCase().includes(term) ||
        (item.city || '').toLowerCase().includes(term)
      )
    }) ?? []

  const openDetail = async (item: SubmissionListItem) => {
    onSelect(item)
    setDetailId(item.id)
    setDetailJson(null)
    try {
      const res = await dashboardFetch<{ doc: any }>(`/api/dashboard/submissions/${item.id}`, {
        method: 'GET',
      })
      setDetailJson(res.doc)
    } catch {
      // ignore – show basic data only
    }
  }

  return (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-[0.14em] uppercase">
            Submissions
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            {data ? `${data.totalDocs} Einträge gesamt` : 'Lade Übersicht…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Suche nach ID, PLZ oder Stadt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-full bg-am-darker text-xs text-am-light placeholder:text-foreground-alt"
          />
          <Button variant="ghost-muted" size="mini" shape="round" className="text-xs">
            Filter
          </Button>
          <Button variant="ghost-muted" size="mini" shape="round" className="text-xs">
            Anzeige
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-4.5rem)] overflow-hidden p-0">
        {loading && (
          <div className="flex h-full flex-col gap-3 p-4">
            <Skeleton className="h-9 w-full bg-am-darker/60" />
            <Skeleton className="h-9 w-full bg-am-darker/60" />
            <Skeleton className="h-9 w-full bg-am-darker/60" />
          </div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="h-full overflow-y-auto p-2">
            <ul className="space-y-1">
              {filtered.map((item) => {
                const created = new Date(item.createdAt)
                const hasAi = Boolean(item.aiGeneratedAt)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2 text-left text-xs transition-colors',
                        'hover:border-am-purple-alt/70 hover:bg-am-darker',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-am-white">
                            #{item.id.slice(-6)}
                          </span>
                          <span className="rounded-full bg-am-light/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-am-light">
                            {item.postalCode}
                          </span>
                          {item.city && (
                            <span className="truncate text-[11px] text-foreground-alt">
                              {item.city}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-foreground-alt">
                          <span>
                            Problemindex:{' '}
                            <span className="font-medium text-am-green-alt">
                              {item.problemIndex}
                            </span>
                          </span>
                          <span>Hitze: {item.heatIntensity}/9</span>
                          <span>Häufigkeit: {item.heatFrequency}</span>
                          {item.desiredChanges.length > 0 && (
                            <span>
                              Wünsche:{' '}
                              {item.desiredChanges.map((d) => d.replace('_', ' ')).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-[11px] text-foreground-alt">
                        <span>{created.toLocaleDateString('de-DE')}</span>
                        <span className="text-[10px]">
                          {created.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {hasAi && (
                          <span className="mt-1 rounded-full bg-am-green/20 px-2 py-0.5 text-[10px] text-am-green-alt">
                            KI-Empfehlung
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
              {filtered.length === 0 && (
                <li className="flex h-32 items-center justify-center text-xs text-foreground-alt">
                  Keine Submissions für den aktuellen Filter.
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      <Sheet open={detailId != null} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent side="right" className="w-full max-w-lg bg-am-dark text-am-white">
          <SheetHeader>
            <SheetTitle className="text-sm uppercase tracking-[0.18em]">
              Submission&nbsp;#{detailId?.slice(-6)}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 max-h-[calc(100vh-7rem)] overflow-y-auto text-xs">
            {detailJson ? (
              <pre className="whitespace-pre-wrap break-words rounded-xl bg-am-darker/80 p-4 text-[11px] leading-relaxed">
                {JSON.stringify(detailJson, null, 2)}
              </pre>
            ) : (
              <p className="text-foreground-alt">Lade Details…</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

