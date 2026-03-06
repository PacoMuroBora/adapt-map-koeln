'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ExternalLink } from 'lucide-react'
import { categoryOptions } from '@/collections/KnowledgeBaseItems/categoryOptions'
import { themeOptions } from '@/collections/KnowledgeBaseItems/themeOptions'
import { AnimatePresence, motion } from 'motion/react'

type KBListItem = {
  id: string
  displayTitle?: string | null
  theme?: string | null
  solution_type?: string | null
  status: string
  location?: string | null
  link?: string | null
  categories?: string[] | null
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
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTheme, setFilterTheme] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSolutionType, setFilterSolutionType] = useState('')

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

  useEffect(() => {
    if (openId === 'new' && !detail) {
      setDetail(defaultCreateDetail())
    }
  }, [openId, detail])

  const filtered =
    data?.docs.filter((item) => {
      const term = search.trim().toLowerCase()
      if (term) {
        const matchesSearch =
          (item.displayTitle ?? '').toLowerCase().includes(term) ||
          (item.theme ?? '').toLowerCase().includes(term) ||
          (item.solution_type ?? '').toLowerCase().includes(term) ||
          (item.location ?? '').toLowerCase().includes(term)
        if (!matchesSearch) return false
      }
      if (filterTheme && (item.theme ?? '') !== filterTheme) return false
      if (filterLocation.trim()) {
        const loc = filterLocation.trim().toLowerCase()
        if (!(item.location ?? '').toLowerCase().includes(loc)) return false
      }
      if (filterStatus && item.status !== filterStatus) return false
      if (filterCategory && !(item.categories ?? []).includes(filterCategory)) return false
      if (filterSolutionType.trim()) {
        const st = filterSolutionType.trim().toLowerCase()
        if (!(item.solution_type ?? '').toLowerCase().includes(st)) return false
      }
      return true
    }) ?? []

  const isCreateMode = openId === 'new'

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

  const defaultCreateDetail = () => ({
    status: 'draft',
    displayTitle: '',
    description: '',
    problems_solved: '',
    link: '',
    solution_type: '',
    theme: '',
    categories: [] as string[],
    location: '',
  })

  const openCreateDrawer = () => {
    setSaveError(null)
    setDetail(defaultCreateDetail())
    setOpenId('new')
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
      const isTip = detail.location === 'universal'
      const payload = {
        displayTitle: detail.displayTitle || 'Neuer Eintrag',
        status: detail.status ?? 'draft',
        description: detail.description,
        problems_solved: detail.problems_solved,
        link: detail.link,
        solution_type: detail.solution_type && String(detail.solution_type).trim() ? detail.solution_type : undefined,
        theme: detail.theme && String(detail.theme).trim() ? detail.theme : undefined,
        categories: Array.isArray(detail.categories) ? detail.categories : undefined,
        location: isTip ? 'universal' : detail.location ?? undefined,
      }
      if (isCreateMode) {
        await dashboardFetch('/api/dashboard/knowledge-base', {
          method: 'POST',
          body: payload,
        })
        setOpenId(null)
        setDetail(null)
        const res = await dashboardFetch<ListResponse>('/api/dashboard/knowledge-base', { method: 'GET' })
        setData(res)
      } else {
        await dashboardFetch(`/api/dashboard/knowledge-base/${openId}`, {
          method: 'PUT',
          body: payload,
        })
        setOpenId(null)
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="white" className="flex h-full min-h-0 flex-col bg-card text-foreground shadow">
      <CardHeader className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-title uppercase">
            Knowledge Base
          </CardTitle>
          <p className="text-base text-foreground-alt">
            {data ? `${data.totalDocs} Einträge` : 'Lade…'}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <div className="flex w-full gap-2 md:w-auto md:justify-end">
            <Button
              variant="default"
              size="mini"
              shape="round"
              className="flex-1 text-base md:flex-none"
              onClick={openCreateDrawer}
            >
              Neuer Eintrag
            </Button>
            <Button
              variant={filterOpen ? 'pill' : 'ghost-muted'}
              size="mini"
              shape="round"
              className="flex-1 text-base md:flex-none"
              onClick={() => setFilterOpen((o) => !o)}
            >
              Filter
            </Button>
          </div>
          <Input
            placeholder="Suche nach Titel, Thema oder Ort…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-full bg-background text-base text-foreground placeholder:text-foreground-alt md:w-96"
          />
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
            <div className="flex flex-wrap items-end gap-4 px-3 py-3 md:px-4">
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Thema</Label>
                <Select
                  value={filterTheme || '__all__'}
                  onValueChange={(v) => setFilterTheme(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="h-9 w-36 rounded-lg border-border/70 bg-background text-base">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle</SelectItem>
                    {themeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Ort</Label>
                <Input
                  placeholder="z. B. universal oder Stadt"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="h-9 w-36 rounded-lg bg-background text-base"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Status</Label>
                <Select
                  value={filterStatus || '__all__'}
                  onValueChange={(v) => setFilterStatus(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="h-9 w-28 rounded-lg border-border/70 bg-background text-base">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Kategorie</Label>
                <Select
                  value={filterCategory || '__all__'}
                  onValueChange={(v) => setFilterCategory(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="h-9 w-36 rounded-lg border-border/70 bg-background text-base">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle</SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-base text-foreground-alt">Solution type</Label>
                <Input
                  placeholder="z. B. startup"
                  value={filterSolutionType}
                  onChange={(e) => setFilterSolutionType(e.target.value)}
                  className="h-9 w-36 rounded-lg bg-background text-base"
                />
              </div>
              <div className="flex-1 min-w-4" aria-hidden />
              <Button
                variant="ghost-muted"
                size="mini"
                shape="round"
                className="text-base shrink-0"
                onClick={() => {
                  setFilterTheme('')
                  setFilterLocation('')
                  setFilterStatus('')
                  setFilterCategory('')
                  setFilterSolutionType('')
                }}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CardContent className="flex-1 min-h-0 overflow-hidden p-0 pt-0 pb-6 md:px-0">
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
          <div className="h-full overflow-y-auto px-3 py-2 md:-mr-6 md:pr-6">
            <ul className="space-y-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <div
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-2xl bg-background px-3 py-3 text-base transition-colors md:px-4',
                      'hover:bg-secondary/30',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openDrawer(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-lg font-medium leading-tight text-foreground">
                          {item.displayTitle || 'Ohne Titel'}
                        </span>
                        {item.theme && (
                          <span className="hidden rounded-full bg-secondary/60 px-2 py-0.5 text-sm uppercase tracking-label text-foreground md:inline-flex">
                            {item.theme}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 hidden flex-wrap items-center gap-x-3 gap-y-1 text-base text-foreground-alt md:flex">
                        {item.location != null && item.location !== '' && (
                          <span>{item.location}</span>
                        )}
                        {item.solution_type != null && item.solution_type !== '' && (
                          <span>{item.solution_type}</span>
                        )}
                        {item.lastSynced && (
                          <span>
                            KI-Sync: {new Date(item.lastSynced).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex flex-shrink-0 items-center gap-2 text-foreground-alt">
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-alt hover:text-foreground"
                          aria-label="Link öffnen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {item.status !== 'published' && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-sm uppercase tracking-label',
                            item.status === 'archived'
                              ? 'bg-secondary/20 text-foreground-alt'
                              : 'bg-am-orange/20 text-am-orange-alt',
                          )}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="flex h-32 items-center justify-center text-base text-foreground-alt">
                  Keine Knowledge-Base-Einträge für den aktuellen Filter.
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>

      <Sheet open={openId != null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent side="right" className="flex w-full max-w-[100vw] flex-col bg-card text-foreground md:max-w-4xl">
          <SheetHeader>
            <SheetTitle className="text-xl uppercase tracking-label">
              {isCreateMode ? 'Neuer Eintrag' : 'Knowledge-Base-Eintrag'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-base" key={openId ?? 'closed'}>
            {detail ? (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Titel</Label>
                  <Input
                    value={detail.displayTitle ?? ''}
                    onChange={(e) => handleFieldChange('displayTitle', e.target.value)}
                    className="h-9 rounded-lg bg-background text-base"
                  />
                </div>
                <div className="grid grid-cols-[auto,1fr] items-start gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="kb-is-tip"
                      checked={detail.location === 'universal'}
                      onCheckedChange={(checked) => {
                        handleFieldChange('location', checked ? 'universal' : '')
                      }}
                    />
                    <Label
                      htmlFor="kb-is-tip"
                      className="cursor-pointer text-base text-foreground-alt"
                    >
                      Universal tip
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground-alt">Ort</Label>
                    <Input
                      value={
                        detail.location === 'universal' ? 'universal' : (detail.location ?? '')
                      }
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      disabled={detail.location === 'universal'}
                      className="h-9 rounded-lg bg-background text-base disabled:opacity-70"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-foreground-alt">Status</Label>
                    <select
                      className="h-9 w-full rounded-lg border border-border/70 bg-background px-2 text-base text-foreground"
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
                      className="h-9 rounded-lg bg-background text-base"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Solution type</Label>
                  <Input
                    value={detail.solution_type ?? ''}
                    onChange={(e) => handleFieldChange('solution_type', e.target.value)}
                    placeholder="z. B. startup"
                    className="h-9 max-w-xs rounded-lg bg-background text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Thema</Label>
                  <Select
                    value={detail.theme && String(detail.theme).trim() ? detail.theme : '__none__'}
                    onValueChange={(v) => handleFieldChange('theme', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 rounded-lg border-border/70 bg-background text-base">
                      <SelectValue placeholder="Thema wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {themeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Kategorien</Label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((opt) => {
                      const selected =
                        Array.isArray(detail.categories) && detail.categories.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const arr = Array.isArray(detail.categories) ? [...detail.categories] : []
                            if (selected) {
                              const i = arr.indexOf(opt.value)
                              if (i >= 0) arr.splice(i, 1)
                            } else {
                              arr.push(opt.value)
                            }
                            handleFieldChange('categories', arr)
                          }}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-sm transition-colors',
                            selected
                              ? 'bg-primary text-primary-foreground border border-primary'
                              : 'border border-border bg-transparent text-foreground-alt hover:border-foreground-alt/50',
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Beschreibung</Label>
                  <Textarea
                    color="purple"
                    size="sm"
                    value={detail.description ?? ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="min-h-[90px] rounded-xl bg-background text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground-alt">Gelöste Probleme</Label>
                  <Textarea
                    color="purple"
                    size="sm"
                    value={detail.problems_solved ?? ''}
                    onChange={(e) => handleFieldChange('problems_solved', e.target.value)}
                    className="min-h-[90px] rounded-xl bg-background text-base"
                  />
                </div>
                {saveError && <p className="text-base text-destructive">{saveError}</p>}
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
              {saving ? 'Speichere…' : isCreateMode ? 'Anlegen' : 'Speichern'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

