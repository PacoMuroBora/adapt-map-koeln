'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'
import { cn } from '@/utilities/ui'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type KBListItem = {
  id: string
  displayTitle?: string | null
  theme?: string | null
  solution_type?: string | null
  status: string
  location?: string | null
  lastSynced: string | null
}

type ListResponse = {
  docs: KBListItem[]
  totalDocs: number
}

export function KBList() {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [openId, setOpenId] = useState<string | null>(null)
  const [detail, setDetail] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await dashboardFetch<ListResponse>('/api/dashboard/knowledge-base', {
          method: 'GET',
        })
        setData(res)
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der Knowledge-Base-Einträge')
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
        (item.displayTitle ?? '').toLowerCase().includes(term) ||
        (item.theme ?? '').toLowerCase().includes(term) ||
        (item.solution_type ?? '').toLowerCase().includes(term) ||
        (item.location ?? '').toLowerCase().includes(term)
      )
    }) ?? []

  const openDrawer = async (item: KBListItem) => {
    setOpenId(item.id)
    setDetail(null)
    setSaveError(null)
    try {
      const res = await dashboardFetch<{ doc: any }>(
        `/api/dashboard/knowledge-base/${item.id}`,
        {
          method: 'GET',
        },
      )
      setDetail(res.doc)
    } catch (err: any) {
      setSaveError(err?.message || 'Fehler beim Laden des Elements')
    }
  }

  const handleFieldChange = (path: string, value: any) => {
    setDetail((prev: any) => {
      if (!prev) return prev
      const next = { ...prev }
      const segments = path.split('.')
      let cursor: any = next
      for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i]
        cursor[key] = cursor[key] ?? {}
        cursor = cursor[key]
      }
      cursor[segments[segments.length - 1]] = value
      return next
    })
  }

  const handleSave = async () => {
    if (!openId || !detail) return
    setSaving(true)
    setSaveError(null)
    try {
      // Only send a subset of fields we expose in the drawer
      const payload = {
        displayTitle: detail.displayTitle,
        status: detail.status,
        description: detail.description,
        problems_solved: detail.problems_solved,
        link: detail.link,
      }
      await dashboardFetch(`/api/dashboard/knowledge-base/${openId}`, {
        method: 'PUT',
        body: payload,
      })
      setOpenId(null)
    } catch (err: any) {
      setSaveError(err?.message || 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-[0.14em] uppercase">
            Knowledge Base
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            {data ? `${data.totalDocs} Einträge` : 'Lade…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Suche nach Titel, Thema oder Ort…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-full bg-am-darker text-xs text-am-light placeholder:text-foreground-alt"
          />
          <Button variant="ghost-muted" size="mini" shape="round" className="text-xs">
            Filter
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
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openDrawer(item)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2 text-left text-xs transition-colors',
                      'hover:border-am-purple-alt/70 hover:bg-am-darker',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-am-white">
                          {item.displayTitle || 'Ohne Titel'}
                        </span>
                        {item.theme && (
                          <span className="rounded-full bg-am-light/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-am-light">
                            {item.theme}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-foreground-alt">
                        {item.solution_type && <span>{item.solution_type}</span>}
                        {item.location && <span>{item.location}</span>}
                        {item.lastSynced && (
                          <span>
                            Vektor-Sync:{' '}
                            {new Date(item.lastSynced).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-[11px] text-foreground-alt">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]',
                          item.status === 'published'
                            ? 'bg-am-green/20 text-am-green-alt'
                            : item.status === 'archived'
                              ? 'bg-am-light/10 text-foreground-alt'
                              : 'bg-am-orange/20 text-am-orange-alt',
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="flex h-32 items-center justify-center text-xs text-foreground-alt">
                  Keine Knowledge-Base-Einträge für den aktuellen Filter.
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      <Sheet open={openId != null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent side="right" className="flex w-full max-w-xl flex-col bg-am-dark text-am-white">
          <SheetHeader>
            <SheetTitle className="text-sm uppercase tracking-[0.18em]">
              Knowledge-Base-Eintrag
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {detail ? (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Titel</Label>
                  <Input
                    value={detail.displayTitle ?? ''}
                    onChange={(e) => handleFieldChange('displayTitle', e.target.value)}
                    className="h-8 rounded-lg bg-am-darker text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-foreground-alt">Status</Label>
                    <select
                      className="h-8 w-full rounded-lg border border-border bg-am-darker px-2 text-xs text-am-light"
                      value={detail.status ?? 'draft'}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground-alt">Link</Label>
                    <Input
                      value={detail.link ?? ''}
                      onChange={(e) => handleFieldChange('link', e.target.value)}
                      className="h-8 rounded-lg bg-am-darker text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Beschreibung</Label>
                  <Textarea
                    color="purple"
                    size="sm"
                    value={detail.description ?? ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="min-h-[80px] rounded-xl bg-am-darker text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Gelöste Probleme</Label>
                  <Textarea
                    color="purple"
                    size="sm"
                    value={detail.problems_solved ?? ''}
                    onChange={(e) => handleFieldChange('problems_solved', e.target.value)}
                    className="min-h-[80px] rounded-xl bg-am-darker text-xs"
                  />
                </div>
                {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              </>
            ) : (
              <p className="text-foreground-alt">Lade Eintrag…</p>
            )}
          </div>
          <SheetFooter className="border-t border-border/40 pt-4">
            <Button
              size="lg"
              shape="round"
              className="w-full justify-center"
              onClick={handleSave}
              disabled={saving || !detail}
            >
              {saving ? 'Speichere…' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

