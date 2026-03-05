'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'
import { cn } from '@/utilities/ui'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink } from 'lucide-react'

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
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTimeRange, setFilterTimeRange] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [filterLocation, setFilterLocation] = useState('')
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
      const term = search.trim().toLowerCase()
      if (term) {
        const matchesSearch =
          item.id.toLowerCase().includes(term) ||
          item.postalCode.toLowerCase().includes(term) ||
          (item.city || '').toLowerCase().includes(term)
        if (!matchesSearch) return false
      }
      if (filterTimeRange !== 'all') {
        const created = new Date(item.createdAt).getTime()
        const now = Date.now()
        const days = filterTimeRange === '7d' ? 7 : filterTimeRange === '30d' ? 30 : 90
        const cutoff = now - days * 24 * 60 * 60 * 1000
        if (created < cutoff) return false
      }
      if (filterLocation.trim()) {
        const loc = filterLocation.trim().toLowerCase()
        const matchesLoc =
          (item.postalCode || '').toLowerCase().includes(loc) ||
          (item.city || '').toLowerCase().includes(loc)
        if (!matchesLoc) return false
      }
      return true
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
    <Card variant="white" className="flex h-full flex-col bg-card text-foreground shadow">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-title uppercase">
            Submissions
          </CardTitle>
          <p className="text-base text-foreground-alt">
            {data ? `${data.totalDocs} Einträge gesamt` : 'Lade Übersicht…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Suche nach ID, PLZ oder Stadt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-96 rounded-full bg-background text-base text-foreground placeholder:text-foreground-alt"
          />
          <Button
            variant={filterOpen ? 'pill' : 'ghost-muted'}
            size="mini"
            shape="round"
            className="text-base"
            onClick={() => setFilterOpen((o) => !o)}
          >
            Filter
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {filterOpen && (
          <motion.div
            key="filter"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-shrink-0 overflow-hidden border-t border-border/50 bg-secondary/30"
          >
            <div className="flex flex-wrap items-end gap-4 px-4 py-3">
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Zeitraum</Label>
                <div className="flex gap-1">
                  {(['all', '7d', '30d', '90d'] as const).map((key) => (
                    <Button
                      key={key}
                      variant={filterTimeRange === key ? 'pill' : 'ghost-muted'}
                      size="tiny"
                      shape="round"
                      className="text-base"
                      onClick={() => setFilterTimeRange(key)}
                    >
                      {key === 'all' ? 'Alle' : key === '7d' ? '7 Tage' : key === '30d' ? '30 Tage' : '90 Tage'}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Ort (PLZ / Stadt)</Label>
                <Input
                  placeholder="z. B. 50667 oder Köln"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="h-9 w-48 rounded-lg bg-background text-base"
                />
              </div>
              <div className="flex-1 min-w-4" aria-hidden />
              <Button
                variant="ghost-muted"
                size="mini"
                shape="round"
                className="text-base shrink-0"
                onClick={() => {
                  setFilterTimeRange('all')
                  setFilterLocation('')
                }}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0 pt-0 pb-6">
        {loading && (
          <div className="flex h-full flex-col gap-3 p-4">
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
          </div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center p-4 text-base text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="h-full overflow-y-auto px-6 py-2">
            <ul className="space-y-2">
              {filtered.map((item) => {
                const created = new Date(item.createdAt)
                const hasAi = Boolean(item.aiGeneratedAt)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3 text-left text-base transition-colors',
                        'hover:bg-secondary/30',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-end gap-2">
                          <span className="truncate text-lg font-medium text-foreground leading-tight">
                            {item.city || 'Ohne Ort'}
                          </span>
                          {hasAi && (
                            <span className="rounded-full bg-am-green/30 px-2 py-0.5 text-sm font-semibold uppercase tracking-label text-am-darker">
                              KI-Empfehlung
                            </span>
                          )}
                          {item.street && (
                            <span className="truncate text-base text-foreground-alt leading-tight">
                              {item.street}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-base text-foreground-alt">
                          <span>
                            Problemindex:{' '}
                            <span className="inline-flex items-center rounded-full bg-am-green/40 px-2 py-0.5 text-base text-foreground">
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
                      <div className="flex flex-col items-end text-base text-foreground-alt">
                        <span>{created.toLocaleDateString('de-DE')}</span>
                        <span className="text-base">
                          {created.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
              {filtered.length === 0 && (
                <li className="flex h-32 items-center justify-center text-base text-foreground-alt">
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
            <SheetTitle className="text-xl uppercase tracking-label">
              Submission&nbsp;#{detailId?.slice(-6)}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 max-h-[calc(100vh-7rem)] overflow-y-auto text-base">
            {detailJson ? (
              <div className="space-y-4">
                {/* Kernmetriken */}
                <div className="rounded-2xl bg-background p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
                        Problemindex
                      </p>
                      <p className="mt-2 inline-flex items-baseline rounded-2xl bg-am-green/40 px-3 py-1 text-3xl font-semibold text-am-darker">
                        {typeof detailJson.problem_index === 'number'
                          ? Math.round(detailJson.problem_index)
                          : detailJson.problem_index ?? '–'}
                      </p>
                    </div>
                    <div className="space-y-1 text-right text-base text-foreground-alt">
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
                  <div className="mt-4 grid grid-cols-2 gap-3 text-base text-foreground-alt">
                    <div className="space-y-1">
                      <p className="uppercase tracking-label">Hitze-Intensität</p>
                      <p className="text-base text-foreground">
                        {typeof detailJson.heatIntensity === 'number'
                          ? `${detailJson.heatIntensity} / 9`
                          : '–'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="uppercase tracking-label">Hitzetage pro Jahr</p>
                      <p className="text-base text-foreground">
                        {HEAT_FREQUENCY_LABEL[detailJson.heatFrequency] ??
                          detailJson.heatFrequency ??
                          '–'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ort */}
                <div className="rounded-2xl bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
                      Ort
                    </p>
                    {detailJson.location?.lat != null &&
                      detailJson.location?.lng != null && (
                        <a
                          href={`https://www.google.com/maps?q=${Number(detailJson.location.lat)},${Number(detailJson.location.lng)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-alt hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          title="In Google Maps öffnen"
                          aria-label="In Google Maps öffnen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                  </div>
                  <div className="mt-2 space-y-1 text-base">
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
                      <p className="text-base text-foreground-alt">
                        Koordinaten:{' '}
                        <span className="font-mono text-sm text-foreground">
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
                  <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
                    Kontext
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-base text-foreground-alt">
                    <div className="space-y-1">
                      <p className="uppercase tracking-label">Wohnsituation</p>
                      <p className="text-base text-foreground">
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
                      <p className="uppercase tracking-label">Person</p>
                      <p className="text-base text-foreground">
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
                  <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
                    Wissen zu Klimaanpassung
                  </p>
                  <div className="mt-2 space-y-1 text-base">
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
                  <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
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
                            className="rounded-full bg-secondary/60 px-3 py-1 text-base font-medium text-foreground"
                          >
                            {label}
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-base text-foreground-alt">
                        Keine expliziten Wünsche ausgewählt.
                      </span>
                    )}
                  </div>
                  {detailJson.user_text && (
                    <div className="mt-4 space-y-1">
                      <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
                        Freitext
                      </p>
                      <p className="whitespace-pre-line text-base text-foreground">
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
                    <p className="text-base font-medium uppercase tracking-label text-foreground-alt">
                      KI-Empfehlungen
                    </p>
                    {detailJson.aiFields?.ai_summary_de && (
                      <p className="mt-2 whitespace-pre-line text-base text-foreground">
                        {detailJson.aiFields.ai_summary_de}
                      </p>
                    )}
                    {Array.isArray(detailJson.aiFields?.ai_referenced_kb_ids) &&
                      detailJson.aiFields.ai_referenced_kb_ids.length > 0 && (
                        <div className="mt-3 space-y-1 text-base">
                          <p className="text-foreground-alt">
                            Verknüpfte Knowledge-Base-Items (IDs aus RAG):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {detailJson.aiFields.ai_referenced_kb_ids.map(
                              (entry: any, idx: number) => (
                                <span
                                  key={`${entry?.kb_id ?? idx}`}
                                  className="rounded-full bg-secondary/60 px-2 py-0.5 font-mono text-sm text-foreground"
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

