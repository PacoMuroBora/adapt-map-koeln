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
  street?: string | null
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

const HEAT_FREQUENCY_LABEL: Record<string, string> = {
  '1-3': '1–3 Tage',
  '4-10': '4–10 Tage',
  '11-20': '11–20 Tage',
  '21-40': '21–40 Tage',
  '>40': '>40 Tage',
}

const DESIRED_CHANGE_LABEL: Record<string, string> = {
  greening: 'Begrünung',
  water: 'Wasser',
  shadow: 'Schatten',
  shading: 'Verschattung',
  cooling: 'Kühlung',
  roof_greening: 'Dachbegrünung',
  facade_greening: 'Fassadenbegrünung',
  water_fountain: 'Wasserspender',
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
                            {item.city || 'Ohne Ort'}
                          </span>
                          {hasAi && (
                            <span className="rounded-full bg-am-green/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-am-darker">
                              KI-Empfehlung
                            </span>
                          )}
                          {item.street && (
                            <span className="truncate text-sm text-foreground-alt">
                              {item.street}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-foreground-alt">
                          <span>
                            Problemindex:{' '}
                            <span className="inline-flex items-center rounded-full bg-am-green/40 px-2 py-0.5 text-xs font-semibold text-am-darker">
                              {Number.isFinite(item.problemIndex)
                                ? Math.round(item.problemIndex)
                                : item.problemIndex}
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
        <SheetContent side="right" className="w-full max-w-4xl bg-card text-foreground">
          <SheetHeader>
            <SheetTitle className="text-base uppercase tracking-[0.18em]">
              Submission&nbsp;#{detailId?.slice(-6)}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 max-h-[calc(100vh-7rem)] overflow-y-auto text-sm">
            {detailJson ? (
              <div className="space-y-4">
                {/* Kernmetriken */}
                <div className="rounded-2xl bg-background p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                        Problemindex
                      </p>
                      <p className="mt-2 inline-flex items-baseline rounded-2xl bg-am-green/40 px-3 py-1 text-3xl font-semibold text-am-darker">
                        {typeof detailJson.problem_index === 'number'
                          ? Math.round(detailJson.problem_index)
                          : detailJson.problem_index ?? '–'}
                      </p>
                    </div>
                    <div className="space-y-1 text-right text-xs text-foreground-alt">
                      <p>
                        Erstellt:&nbsp;
                        <span className="font-medium text-foreground">
                          {detailJson.createdAt
                            ? new Date(detailJson.createdAt).toLocaleString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '–'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-foreground-alt">
                    <div className="space-y-1">
                      <p className="uppercase tracking-[0.18em]">Hitze-Intensität</p>
                      <p className="text-sm text-foreground">
                        {typeof detailJson.heatIntensity === 'number'
                          ? `${detailJson.heatIntensity} / 9`
                          : '–'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="uppercase tracking-[0.18em]">Hitzetage pro Jahr</p>
                      <p className="text-sm text-foreground">
                        {HEAT_FREQUENCY_LABEL[detailJson.heatFrequency] ??
                          detailJson.heatFrequency ??
                          '–'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ort */}
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                    Ort
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">
                      {detailJson.location?.postal_code}{' '}
                      {detailJson.location?.city && (
                        <span className="text-foreground-alt">{detailJson.location.city}</span>
                      )}
                    </p>
                    {detailJson.location?.street && (
                      <p className="text-foreground-alt">{detailJson.location.street}</p>
                    )}
                    {(detailJson.location?.lat || detailJson.location?.lng) && (
                      <p className="text-xs text-foreground-alt">
                        Koordinaten:{' '}
                        <span className="font-mono text-[11px] text-foreground">
                          {detailJson.location?.lat?.toFixed
                            ? detailJson.location.lat.toFixed(5)
                            : detailJson.location?.lat}{' '}
                          /{' '}
                          {detailJson.location?.lng?.toFixed
                            ? detailJson.location.lng.toFixed(5)
                            : detailJson.location?.lng}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Wohnsituation & Person */}
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                    Kontext
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-foreground-alt">
                    <div className="space-y-1">
                      <p className="uppercase tracking-[0.18em]">Wohnsituation</p>
                      <p className="text-sm text-foreground">
                        {detailJson.livingSituation?.housingType === 'apartment'
                          ? 'Wohnung'
                          : detailJson.livingSituation?.housingType === 'house'
                            ? 'Haus'
                            : '–'}
                      </p>
                      {detailJson.livingSituation && (
                        <>
                          <p>
                            Grün im Umfeld:{' '}
                            <span className="text-foreground">
                              {detailJson.livingSituation.greenNeighborhood === 'yes'
                                ? 'Ja'
                                : detailJson.livingSituation.greenNeighborhood === 'no'
                                  ? 'Nein'
                                  : detailJson.livingSituation.greenNeighborhood === 'unsure'
                                    ? 'Weiß nicht'
                                    : '–'}
                            </span>
                          </p>
                          <p>
                            Lage:{' '}
                            <span className="text-foreground">
                              {detailJson.livingSituation.cityArea === 'inner'
                                ? 'Innenstadt'
                                : detailJson.livingSituation.cityArea === 'outer'
                                  ? 'Äußerer Bereich'
                                  : '–'}
                            </span>
                          </p>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="uppercase tracking-[0.18em]">Person</p>
                      <p className="text-sm text-foreground">
                        {detailJson.personalFields?.age
                          ? `Alter: ${detailJson.personalFields.age}`
                          : 'Kein Alter angegeben'}
                      </p>
                      {detailJson.personalFields?.householdSize && (
                        <p>
                          Haushalt:{' '}
                          <span className="text-foreground">
                            {detailJson.personalFields.householdSize} Personen
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Klimaanpassung */}
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                    Wissen zu Klimaanpassung
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      Begriff bekannt:{' '}
                      <span className="font-medium">
                        {detailJson.climateAdaptationKnowledge?.knowsTerm ? 'Ja' : 'Nein'}
                      </span>
                    </p>
                    {detailJson.climateAdaptationKnowledge?.description && (
                      <p className="mt-1 whitespace-pre-line text-foreground-alt">
                        {detailJson.climateAdaptationKnowledge.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Wünsche & Beschreibung */}
                <div className="rounded-2xl bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                    Wünsche
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(detailJson.desiredChanges) && detailJson.desiredChanges.length > 0 ? (
                      detailJson.desiredChanges.map((entry: any, idx: number) => {
                        const key = entry?.icon ?? entry
                        const label = DESIRED_CHANGE_LABEL[key] ?? String(key)
                        return (
                          <span
                            key={`${key}-${idx}`}
                            className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground"
                          >
                            {label}
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-sm text-foreground-alt">
                        Keine expliziten Wünsche ausgewählt.
                      </span>
                    )}
                  </div>
                  {detailJson.user_text && (
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                        Freitext
                      </p>
                      <p className="whitespace-pre-line text-sm text-foreground">
                        {detailJson.user_text}
                      </p>
                    </div>
                  )}
                </div>

                {/* KI-Empfehlungen */}
                {(detailJson.aiFields?.ai_summary_de ||
                  (Array.isArray(detailJson.aiFields?.ai_referenced_kb_ids) &&
                    detailJson.aiFields.ai_referenced_kb_ids.length > 0)) && (
                  <div className="rounded-2xl bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-alt">
                      KI-Empfehlungen
                    </p>
                    {detailJson.aiFields?.ai_summary_de && (
                      <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                        {detailJson.aiFields.ai_summary_de}
                      </p>
                    )}
                    {Array.isArray(detailJson.aiFields?.ai_referenced_kb_ids) &&
                      detailJson.aiFields.ai_referenced_kb_ids.length > 0 && (
                        <div className="mt-3 space-y-1 text-xs">
                          <p className="text-foreground-alt">
                            Verknüpfte Knowledge-Base-Items (IDs aus RAG):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {detailJson.aiFields.ai_referenced_kb_ids.map(
                              (entry: any, idx: number) => (
                                <span
                                  key={`${entry?.kb_id ?? idx}`}
                                  className="rounded-full bg-secondary/60 px-2 py-0.5 font-mono text-[11px] text-foreground"
                                >
                                  {entry?.kb_id ?? 'Unbekannt'}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-foreground-alt">Lade Details…</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

