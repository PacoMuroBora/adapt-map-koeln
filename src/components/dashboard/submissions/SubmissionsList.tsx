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
    <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-[0.16em] uppercase">
            Submissions
          </CardTitle>
          <p className="text-sm text-foreground-alt">
            {data ? `${data.totalDocs} Einträge gesamt` : 'Lade Übersicht…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Suche nach ID, PLZ oder Stadt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-full bg-secondary text-sm text-foreground placeholder:text-foreground-alt"
          />
          <Button variant="ghost-muted" size="mini" shape="round" className="text-sm">
            Filter
          </Button>
          <Button variant="ghost-muted" size="mini" shape="round" className="text-sm">
            Anzeige
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
        {loading && (
          <div className="flex h-full flex-col gap-3 p-4">
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
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
                        'flex w-full items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3 text-left text-sm transition-colors',
                        'hover:bg-secondary/60',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-foreground">
                            #{item.id.slice(-6)}
                          </span>
                          <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-foreground">
                            {item.postalCode}
                          </span>
                          {item.city && (
                            <span className="truncate text-sm text-foreground-alt">
                              {item.city}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-foreground-alt">
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
                      <div className="flex flex-col items-end text-sm text-foreground-alt">
                        <span>{created.toLocaleDateString('de-DE')}</span>
                        <span className="text-xs">
                          {created.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {hasAi && (
                          <span className="mt-1 rounded-full bg-am-green/30 px-2 py-0.5 text-xs text-am-darker">
                            KI-Empfehlung
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
              {filtered.length === 0 && (
                <li className="flex h-32 items-center justify-center text-sm text-foreground-alt">
                  Keine Submissions für den aktuellen Filter.
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      <Sheet open={detailId != null} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent side="right" className="w-full max-w-lg bg-card text-foreground">
          <SheetHeader>
            <SheetTitle className="text-base uppercase tracking-[0.18em]">
              Submission&nbsp;#{detailId?.slice(-6)}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 max-h-[calc(100vh-7rem)] overflow-y-auto text-sm">
            {detailJson ? (
              <pre className="whitespace-pre-wrap break-words rounded-xl bg-am-white p-4 text-[13px] leading-relaxed">
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

