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

type TabId = 'header-footer' | 'legal' | 'map' | 'ui-text' | 'seo'

type SiteSettingsGlobal = any
type UICopyGlobal = any

export function SiteSettingsClient() {
  const [tab, setTab] = useState<TabId>('header-footer')
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

  const renderHeaderFooter = () => (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            Header & Footer
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            Navigation und Footer-Struktur werden im Payload Admin gepflegt.
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
        <div className="space-y-3 text-xs text-foreground-alt">
          <p>
            Nutze den Payload Admin, um Navigationspunkte, Call-to-Action-Buttons und Footer-Links
            zu bearbeiten. Änderungen werden automatisch auch im Editor-Dashboard sichtbar.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Header: globale Navigation, CTA-Buttons</li>
            <li>Footer: rechtliche Links, Logos und Adressblock</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            href="/admin/globals/header"
            variant="outline-white"
            size="mini"
            shape="round"
            className="text-xs"
          >
            Header im Admin öffnen
          </Button>
          <Button
            href="/admin/globals/footer"
            variant="outline-white"
            size="mini"
            shape="round"
            className="text-xs"
          >
            Footer im Admin öffnen
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderLegal = () => (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            Legal & Cookie Banner
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            Cookie-Banner direkt hier anpassen, rechtliche Texte im Payload Admin bearbeiten.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 text-xs">
        {siteSettings && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-foreground-alt uppercase tracking-[0.18em]">
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-foreground-alt uppercase tracking-[0.18em]">
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground-alt uppercase tracking-[0.18em]">
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
                className="min-h-[80px] bg-am-darker text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-foreground-alt uppercase tracking-[0.18em]">
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-foreground-alt uppercase tracking-[0.18em]">
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
            </div>
          </>
        )}
        <div className="mt-4 space-y-2 rounded-2xl border border-border/50 bg-am-darker/80 p-4 text-xs text-foreground-alt">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-am-light">
            Rechtstexte (Impressum & Datenschutz)
          </p>
          <p>
            Die Rich-Text-Inhalte für Impressum, Datenschutzerklärung und AGB bearbeiten Sie
            weiterhin im Payload Admin mit dem vollständigen Lexical Editor.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              href="/admin/globals/site-settings?tab=Legal%20%26%20Cookies"
              variant="outline-white"
              size="mini"
              shape="round"
              className="text-xs"
            >
              Legal-Texte im Admin öffnen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderMap = () => (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            Map-Einstellungen
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            Kartenzentrum, Kachelgröße und Opazität für die Heatmap.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid h-full grid-cols-1 gap-6 p-6 text-xs md:grid-cols-2">
        {siteSettings && (
          <>
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Kartenzentrum
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-foreground-alt">Breitengrad (lat)</span>
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
                    className="h-8 rounded-lg bg-am-darker text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-foreground-alt">Längengrad (lng)</span>
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
                    className="h-8 rounded-lg bg-am-darker text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-foreground-alt">Zoom-Level</span>
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Heatmap
              </p>
              <div className="space-y-1">
                <span className="text-[11px] text-foreground-alt">Kachelgröße (m)</span>
                <Input
                  type="number"
                  value={siteSettings.heatmapTileSize ?? ''}
                  onChange={(e) =>
                    patchSiteSettings((current) => ({
                      ...current,
                      heatmapTileSize: parseInt(e.target.value, 10),
                    }))
                  }
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-foreground-alt">Opacity (0–1)</span>
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderUiText = () => (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            UI Text
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            Texte für Landingpage, Consent-Screen und Fragebogensteuerung.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid h-full grid-cols-1 gap-6 p-6 text-xs md:grid-cols-2">
        {uiCopy && (
          <>
            <div className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Landingpage
              </p>
              <Input
                value={uiCopy.landingPage?.title ?? ''}
                onChange={(e) =>
                  patchUiCopy((current) => ({
                    ...current,
                    landingPage: {
                      ...current.landingPage,
                      title: e.target.value,
                    },
                  }))
                }
                className="h-8 rounded-lg bg-am-darker text-xs"
              />
              <Textarea
                color="purple"
                size="sm"
                value={uiCopy.landingPage?.description ?? ''}
                onChange={(e) =>
                  patchUiCopy((current) => ({
                    ...current,
                    landingPage: {
                      ...current.landingPage,
                      description: e.target.value,
                    },
                  }))
                }
                className="min-h-[80px] bg-am-darker text-xs"
              />
              <Input
                value={uiCopy.landingPage?.ctaButton ?? ''}
                onChange={(e) =>
                  patchUiCopy((current) => ({
                    ...current,
                    landingPage: {
                      ...current.landingPage,
                      ctaButton: e.target.value,
                    },
                  }))
                }
                className="h-8 rounded-lg bg-am-darker text-xs"
              />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Einwilligung & Fragebogen
              </p>
              <Input
                value={uiCopy.consent?.title ?? ''}
                onChange={(e) =>
                  patchUiCopy((current) => ({
                    ...current,
                    consent: {
                      ...current.consent,
                      title: e.target.value,
                    },
                  }))
                }
                className="h-8 rounded-lg bg-am-darker text-xs"
              />
              <Textarea
                color="purple"
                size="sm"
                value={uiCopy.consent?.message ?? ''}
                onChange={(e) =>
                  patchUiCopy((current) => ({
                    ...current,
                    consent: {
                      ...current.consent,
                      message: e.target.value,
                    },
                  }))
                }
                className="min-h-[80px] bg-am-darker text-xs"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={uiCopy.consent?.acceptButton ?? ''}
                  onChange={(e) =>
                    patchUiCopy((current) => ({
                      ...current,
                      consent: {
                        ...current.consent,
                        acceptButton: e.target.value,
                      },
                    }))
                  }
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
                <Input
                  value={uiCopy.consent?.declineButton ?? ''}
                  onChange={(e) =>
                    patchUiCopy((current) => ({
                      ...current,
                      consent: {
                        ...current.consent,
                        declineButton: e.target.value,
                      },
                    }))
                  }
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
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
                  className="h-8 rounded-lg bg-am-darker text-xs"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderSeo = () => (
    <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold tracking-[0.14em] uppercase">
            SEO Grundeinstellungen
          </CardTitle>
          <p className="text-xs text-foreground-alt">
            Standard Meta-Tags für Seiten ohne eigene SEO-Konfiguration.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid h-full grid-cols-1 gap-6 p-6 text-xs md:grid-cols-2">
        {siteSettings && (
          <>
            <div className="space-y-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Meta Title
              </span>
              <Input
                value={siteSettings.metaTitle ?? ''}
                onChange={(e) =>
                  patchSiteSettings((current) => ({
                    ...current,
                    metaTitle: e.target.value,
                  }))
                }
                className="h-8 rounded-lg bg-am-darker text-xs"
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Meta Description
              </span>
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
                className="min-h-[80px] bg-am-darker text-xs"
              />
            </div>
            <div className="space-y-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground-alt">
                Twitter Handle & Keywords
              </span>
              <Input
                value={siteSettings.twitterHandle ?? ''}
                onChange={(e) =>
                  patchSiteSettings((current) => ({
                    ...current,
                    twitterHandle: e.target.value,
                  }))
                }
                className="h-8 rounded-lg bg-am-darker text-xs"
              />
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
                className="min-h-[80px] bg-am-darker text-xs"
              />
              <div className="mt-2 space-y-1 rounded-2xl border border-border/50 bg-am-darker/80 p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-am-light">
                  OG Bild
                </p>
                <p className="text-[11px] text-foreground-alt">
                  Das Standard-OG-Bild wird im Payload Admin gesetzt, damit Uploads & Bildgrößen
                  korrekt verwaltet werden.
                </p>
                <Button
                  href="/admin/globals/site-settings?tab=SEO"
                  variant="outline-white"
                  size="mini"
                  shape="round"
                  className="mt-2 text-xs"
                >
                  SEO im Admin öffnen
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
        <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
          <CardContent className="flex h-full items-center justify-center p-6">
            <Skeleton className="h-32 w-full rounded-2xl bg-am-darker/60" />
          </CardContent>
        </Card>
      )
    }
    if (error) {
      return (
        <Card className="h-full rounded-3xl border border-border bg-am-dark text-am-white">
          <CardContent className="flex h-full items-center justify-center p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )
    }

    switch (tab) {
      case 'header-footer':
        return renderHeaderFooter()
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
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-headings text-lg font-semibold tracking-[0.18em] uppercase">
              Site Settings
            </h1>
            <p className="text-xs text-foreground-alt">
              Globale Einstellungen für Karten, Texte, rechtliche Inhalte und SEO.
            </p>
          </div>
          <div className="inline-flex gap-2 rounded-full bg-am-darker/80 p-1">
            <Button
              size="mini"
              shape="round"
              variant={tab === 'header-footer' ? 'default' : 'ghost-muted'}
              className={cn('px-3 text-xs', tab === 'header-footer' && 'bg-am-green-alt text-am-dark')}
              onClick={() => setTab('header-footer')}
            >
              Header & Footer
            </Button>
            <Button
              size="mini"
              shape="round"
              variant={tab === 'legal' ? 'default' : 'ghost-muted'}
              className={cn('px-3 text-xs', tab === 'legal' && 'bg-am-green-alt text-am-dark')}
              onClick={() => setTab('legal')}
            >
              Legal & Cookies
            </Button>
            <Button
              size="mini"
              shape="round"
              variant={tab === 'map' ? 'default' : 'ghost-muted'}
              className={cn('px-3 text-xs', tab === 'map' && 'bg-am-green-alt text-am-dark')}
              onClick={() => setTab('map')}
            >
              Map
            </Button>
            <Button
              size="mini"
              shape="round"
              variant={tab === 'ui-text' ? 'default' : 'ghost-muted'}
              className={cn('px-3 text-xs', tab === 'ui-text' && 'bg-am-green-alt text-am-dark')}
              onClick={() => setTab('ui-text')}
            >
              UI Text
            </Button>
            <Button
              size="mini"
              shape="round"
              variant={tab === 'seo' ? 'default' : 'ghost-muted'}
              className={cn('px-3 text-xs', tab === 'seo' && 'bg-am-green-alt text-am-dark')}
              onClick={() => setTab('seo')}
            >
              SEO
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">{renderActiveTab()}</div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
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

