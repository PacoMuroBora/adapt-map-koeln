'use client'

import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardFetch } from '@/lib/dashboard-api'
import { cn } from '@/utilities/ui'

type TabId = 'legal' | 'map' | 'ui-text' | 'seo'

type SiteSettingsGlobal = any
type UICopyGlobal = any

export function SiteSettingsClient() {
  const [tab, setTab] = useState<TabId>('legal')
  const [siteSettings, setSiteSettings] = useState<SiteSettingsGlobal | null>(null)
  const [uiCopy, setUiCopy] = useState<UICopyGlobal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [site, ui] = await Promise.all([
          dashboardFetch<{ doc: SiteSettingsGlobal }>('/api/dashboard/globals/site-settings', {
            method: 'GET',
          }),
          dashboardFetch<{ doc: UICopyGlobal }>('/api/dashboard/globals/ui-copy', {
            method: 'GET',
          }),
        ])
        setSiteSettings(site.doc)
        setUiCopy(ui.doc)
      } catch (err: any) {
        setError(err?.message || 'Fehler beim Laden der Einstellungen')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const patchSiteSettings = (updater: (current: SiteSettingsGlobal) => SiteSettingsGlobal) => {
    setSiteSettings((prev: SiteSettingsGlobal | null) => (prev ? updater(prev) : prev))
  }

  const patchUiCopy = (updater: (current: UICopyGlobal) => UICopyGlobal) => {
    setUiCopy((prev: UICopyGlobal | null) => (prev ? updater(prev) : prev))
  }

  const saveAll = async () => {
    if (!siteSettings || !uiCopy) return
    setSaving(true)
    setSaveMessage(null)
    setError(null)
    try {
      await Promise.all([
        dashboardFetch('/api/dashboard/globals/site-settings', {
          method: 'PUT',
          body: siteSettings,
        }),
        dashboardFetch('/api/dashboard/globals/ui-copy', {
          method: 'PUT',
          body: uiCopy,
        }),
      ])
      setSaveMessage('Änderungen gespeichert.')
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const renderLegal = () => (
    <Card variant="white" className="bg-card text-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold tracking-title uppercase">
            Legal & Cookie Banner
          </CardTitle>
          <p className="text-base text-foreground-alt">
            Cookie-Banner direkt hier anpassen, rechtliche Texte im Payload Admin bearbeiten.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 text-base">
        {siteSettings && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground-alt uppercase tracking-label">
                  Cookie-Banner Titel
                </p>
                  <Input
                  value={siteSettings.cookieBanner?.title ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      cookieBanner: {
                        ...current.cookieBanner,
                        title: e.target.value,
                      },
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground-alt uppercase tracking-label">
                  Link-Text Datenschutzerklärung
                </p>
                <Input
                  value={siteSettings.cookieBanner?.privacyLinkText ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      cookieBanner: {
                        ...current.cookieBanner,
                        privacyLinkText: e.target.value,
                      },
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground-alt uppercase tracking-label">
                Cookie-Banner Nachricht
              </p>
              <Textarea
                color="purple"
                size="sm"
                value={siteSettings.cookieBanner?.message ?? ''}
                onChange={(e) =>
                  patchSiteSettings((current) => ({
                    ...current,
                    cookieBanner: {
                      ...current.cookieBanner,
                      message: e.target.value,
                    },
                  }))
                }
                className="min-h-[90px] bg-background text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground-alt uppercase tracking-label">
                  Button „Alle akzeptieren“
                </p>
                <Input
                  value={siteSettings.cookieBanner?.acceptAllText ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      cookieBanner: {
                        ...current.cookieBanner,
                        acceptAllText: e.target.value,
                      },
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground-alt uppercase tracking-label">
                  Button „Nur notwendige“
                </p>
                <Input
                  value={siteSettings.cookieBanner?.acceptNecessaryText ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      cookieBanner: {
                        ...current.cookieBanner,
                        acceptNecessaryText: e.target.value,
                      },
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderMap = () => (
    <Card variant="white" className="bg-card text-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold tracking-title uppercase">
            Map-Einstellungen
          </CardTitle>
          <p className="text-base text-foreground-alt">
            Kartenzentrum, Kachelgröße und Opazität für die Heatmap.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 p-6 text-base md:grid-cols-2">
        {siteSettings && (
          <>
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                Kartenzentrum
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-sm text-foreground-alt">Breitengrad (lat)</span>
                  <Input
                    type="number"
                    value={siteSettings.mapCenter?.lat ?? ''}
                    onChange={(e) =>
                      patchSiteSettings((current) => ({
                        ...current,
                        mapCenter: {
                          ...current.mapCenter,
                          lat: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="h-9 rounded-lg bg-background text-base"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-foreground-alt">Längengrad (lng)</span>
                  <Input
                    type="number"
                    value={siteSettings.mapCenter?.lng ?? ''}
                    onChange={(e) =>
                      patchSiteSettings((current) => ({
                        ...current,
                        mapCenter: {
                          ...current.mapCenter,
                          lng: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="h-9 rounded-lg bg-background text-base"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-foreground-alt">Zoom-Level</span>
                <Input
                  type="number"
                  value={siteSettings.mapCenter?.zoom ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      mapCenter: {
                        ...current.mapCenter,
                        zoom: parseInt(e.target.value, 10),
                      },
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                Heatmap
              </p>
              <div className="space-y-1">
                <span className="text-sm text-foreground-alt">Kachelgröße (m)</span>
                <Input
                  type="number"
                  value={siteSettings.heatmapTileSize ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      heatmapTileSize: parseInt(e.target.value, 10),
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm text-foreground-alt">Opacity (0–1)</span>
                <Input
                  type="number"
                  step="0.01"
                  value={siteSettings.heatmapTileOpacity ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      heatmapTileOpacity: parseFloat(e.target.value),
                    }))
                  }
                  className="h-9 rounded-lg bg-background text-base"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderUiText = () => (
    <Card variant="white" className="bg-card text-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold tracking-title uppercase">
            UI Text
          </CardTitle>
          <p className="text-base text-foreground-alt">
            Button-Labels für die Fragebogen-Navigation (Weiter / Zurück).
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 p-6 text-base md:grid-cols-2">
        {uiCopy && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                Fragebogen
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm text-foreground-alt">
                    Button „Weiter“
                  </label>
                  <Input
                    value={uiCopy.questionnaire?.nextButton ?? ''}
                    onChange={(e) =>
                      patchUiCopy((current) => ({
                        ...current,
                        questionnaire: {
                          ...current.questionnaire,
                          nextButton: e.target.value,
                        },
                      }))
                    }
                    className="h-9 rounded-lg bg-background text-base"
                    placeholder="Weiter"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-foreground-alt">
                    Button „Zurück“
                  </label>
                  <Input
                    value={uiCopy.questionnaire?.previousButton ?? ''}
                    onChange={(e) =>
                      patchUiCopy((current) => ({
                        ...current,
                        questionnaire: {
                          ...current.questionnaire,
                          previousButton: e.target.value,
                        },
                      }))
                    }
                    className="h-9 rounded-lg bg-background text-base"
                    placeholder="Zurück"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderSeo = () => (
    <Card variant="white" className="bg-card text-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold tracking-title uppercase">
            SEO Grundeinstellungen
          </CardTitle>
          <p className="text-base text-foreground-alt">
            Standard Meta-Tags für Seiten ohne eigene SEO-Konfiguration.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 text-base">
        {siteSettings && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                    Meta Title
                  </p>
                  <Input
                    value={siteSettings.metaTitle ?? ''}
                    onChange={(e) =>
                      patchSiteSettings((current) => ({
                        ...current,
                        metaTitle: e.target.value,
                      }))
                    }
                    className="h-9 rounded-lg bg-background text-base"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                    Meta Description
                  </p>
                  <Textarea
                    color="purple"
                    size="sm"
                    value={siteSettings.metaDescription ?? ''}
                    onChange={(e) =>
                      patchSiteSettings((current) => ({
                        ...current,
                        metaDescription: e.target.value,
                      }))
                    }
                    className="min-h-[90px] bg-background text-base"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                    Twitter Handle
                  </p>
                  <Input
                    value={siteSettings.twitterHandle ?? ''}
                    onChange={(e) =>
                      patchSiteSettings((current) => ({
                        ...current,
                        twitterHandle: e.target.value,
                      }))
                    }
                    className="h-9 rounded-lg bg-background text-base"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                    Keywords
                  </p>
                  <Textarea
                    color="purple"
                    size="sm"
                    value={siteSettings.keywords ?? ''}
                    onChange={(e) =>
                      patchSiteSettings((current) => ({
                        ...current,
                        keywords: e.target.value,
                      }))
                    }
                    className="min-h-[90px] bg-background text-base"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/30 bg-secondary/30 p-4">
              <p className="text-sm font-medium uppercase tracking-label text-foreground-alt">
                OG Bild & Seiten
              </p>
              <p className="mt-1 text-base text-foreground-alt">
                Das Standard-OG-Bild wird im Payload Admin gesetzt. Pro-Seiten-SEO bearbeiten Sie
                in der Pages-Collection.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  href="/admin/globals/site-settings?tab=SEO"
                  variant="ghost-muted"
                  size="mini"
                  shape="round"
                  className="text-base hover:bg-muted/50"
                >
                  SEO im Admin öffnen
                </Button>
                <Button
                  href="/admin/collections/pages"
                  variant="ghost-muted"
                  size="mini"
                  shape="round"
                  className="text-base hover:bg-muted/50"
                >
                  Pages im Admin bearbeiten
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderActiveTab = () => {
    if (loading) {
      return (
        <Card className="h-full rounded-3xl bg-am-white text-foreground shadow-sm">
          <CardContent className="flex h-full items-center justify-center p-6">
            <Skeleton className="h-32 w-full rounded-2xl bg-secondary/40" />
          </CardContent>
        </Card>
      )
    }
    if (error) {
      return (
        <Card className="h-full rounded-3xl bg-am-white text-foreground shadow-sm">
          <CardContent className="flex h-full items-center justify-center p-6 text-base text-destructive">
            {error}
          </CardContent>
        </Card>
      )
    }

    switch (tab) {
      case 'legal':
        return renderLegal()
      case 'map':
        return renderMap()
      case 'ui-text':
        return renderUiText()
      case 'seo':
        return renderSeo()
      default:
        return null
    }
  }

  return (
    <DashboardShell>
      <div className="flex h-full flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-headings text-2xl font-semibold tracking-label uppercase">
              Site Settings
            </h1>
            <p className="text-base text-foreground-alt">
              Globale Einstellungen für Karten, Texte, rechtliche Inhalte und SEO.
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-4">
            <div className="inline-flex gap-2 rounded-full bg-secondary/40 p-1">
              <Button
                size="mini"
                shape="round"
                variant={tab === 'legal' ? 'pill' : 'ghost-muted'}
                className={cn('px-3 text-base', tab === 'legal' && 'bg-am-green-alt text-am-dark')}
                onClick={() => setTab('legal')}
              >
                Legal & Cookies
              </Button>
              <Button
                size="mini"
                shape="round"
                variant={tab === 'map' ? 'pill' : 'ghost-muted'}
                className={cn('px-3 text-base', tab === 'map' && 'bg-am-green-alt text-am-dark')}
                onClick={() => setTab('map')}
              >
                Map
              </Button>
              <Button
                size="mini"
                shape="round"
                variant={tab === 'ui-text' ? 'pill' : 'ghost-muted'}
                className={cn('px-3 text-base', tab === 'ui-text' && 'bg-am-green-alt text-am-dark')}
                onClick={() => setTab('ui-text')}
              >
                UI Text
              </Button>
              <Button
                size="mini"
                shape="round"
                variant={tab === 'seo' ? 'pill' : 'ghost-muted'}
                className={cn('px-3 text-base', tab === 'seo' && 'bg-am-green-alt text-am-dark')}
                onClick={() => setTab('seo')}
              >
                SEO
              </Button>
            </div>
            <Button
              href="/admin/collections/pages"
              variant="pill"
              size="default"
              shape="round"
              iconAfter="external-link"
              className="shrink-0 px-4 py-1.5"
            >
              Pages im Admin bearbeiten
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">{renderActiveTab()}</div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-base">
          <div className="text-foreground-alt">
            {saveMessage && <span className="text-am-green-alt">{saveMessage}</span>}
            {error && <span className="text-destructive">{error}</span>}
          </div>
          <Button
            size="lg"
            shape="round"
            className="px-6"
            onClick={saveAll}
            disabled={saving || loading || !siteSettings || !uiCopy}
          >
            {saving ? 'Speichere…' : 'Änderungen speichern'}
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}

