'use client'

import { AIRecommendationCTA } from '@/components/AIRecommendationCTA'
import { Button } from '@/components/ui/button'
import { HeatmapBlockComponent } from '@/blocks/HeatmapBlock/Component'
import { useSubmission } from '@/providers/Submission'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'

/** Gradient from Figma (reversed: purple = low, orange = high): 0% #4D3EC9 → … → 100% #FF8429. Maps index 0–100 to hex. */
function problemIndexToGradientColor(index: number): string {
  const t = 1 - Math.max(0, Math.min(100, index)) / 100
  const hexToRgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff] as const
  }
  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')

  const stops = [
    { pos: 0, hex: '#FF8429' },
    { pos: 0.47118, hex: '#DAFA38' },
    { pos: 0.6683, hex: '#B5E49C' },
    { pos: 0.77407, hex: '#9F94FF' },
    { pos: 1, hex: '#4D3EC9' },
  ] as const

  let i = 0
  while (i < stops.length - 1 && t > stops[i + 1].pos) i++
  const a = stops[i]
  const b = stops[i + 1]
  const u = (t - a.pos) / (b.pos - a.pos)
  const [r0, g0, b0] = hexToRgb(a.hex)
  const [r1, g1, b1] = hexToRgb(b.hex)
  const r = r0 + (r1 - r0) * u
  const g = g0 + (g1 - g0) * u
  const b_ = b0 + (b1 - b0) * u
  return rgbToHex(r, g, b_)
}

/** Returns 'black' or 'white' for readable contrast on the given hex background (relative luminance). */
function contrastTextColor(hex: string): 'black' | 'white' {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 0xff) / 255
  const g = ((n >> 8) & 0xff) / 255
  const b = (n & 0xff) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.4 ? 'black' : 'white'
}

type PlzStats = { count: number; districtName: string | null; city: string | null } | null

export default function ResultsPage() {
  const { state } = useSubmission()
  const [plzStats, setPlzStats] = React.useState<PlzStats>(null)
  const [showError, setShowError] = React.useState(false)

  useEffect(() => {
    if (!state.submissionId && (state.problemIndex === null || state.problemIndex === undefined)) {
      setShowError(true)
    } else {
      setShowError(false)
    }
  }, [state])

  useEffect(() => {
    const postalCode = state.location?.postal_code
    if (!postalCode) return

    let cancelled = false
    fetch(`/api/submissions/count-by-plz?postalCode=${encodeURIComponent(postalCode)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch'))))
      .then((data: { count: number; districtName?: string | null; city?: string | null }) => {
        if (!cancelled) {
          setPlzStats({
            count: data.count,
            districtName: data.districtName ?? null,
            city: data.city ?? null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setPlzStats(null)
      })
    return () => {
      cancelled = true
    }
  }, [state.location?.postal_code])

  if (showError) {
    return (
      <div className="min-h-screen">
        <section className="container relative bg-black background-grid-dark">
          <div className="inner-container relative z-10 flex flex-col justify-center items-center min-h-screen gap-8 py-16">
            <AlertCircle className="size-16 text-destructive" aria-hidden />
            <div className="flex flex-col gap-4 text-center max-w-md">
              <h1 className="font-headings text-h2 font-semibold text-white">Keine Umfragedaten</h1>
              <p className="font-body text-body text-white/90">
                Es wurden keine Umfragedaten gefunden. Bitte starte die Umfrage von vorne, um deine
                Ergebnisse zu sehen.
              </p>
            </div>
            <Button asChild variant="default" size="lg">
              <Link href="/">Zur Startseite</Link>
            </Button>
          </div>
        </section>
      </div>
    )
  }

  const problemIndex = state.problemIndex ?? 0
  const problemIndexColor = useMemo(() => problemIndexToGradientColor(problemIndex), [problemIndex])
  const problemIndexTextColor = useMemo(
    () => contrastTextColor(problemIndexColor),
    [problemIndexColor],
  )

  return (
    <div className="min-h-screen">
      {/* Intro section – design: Figma Results intro */}
      <section className="container relative bg-black background-grid-dark">
        <div className="inner-container relative z-10 flex flex-col justify-end pb-6 md:pb-12 lg:pb-24 pt-16 min-h-screen gap-12">
          <div className="flex max-w-[640px] lg:max-w-[800px] flex-col gap-8 md:gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0 uppercase space-y-2">
                <p className="font-mono text-sm uppercase tracking-wide text-primary">adaptmap</p>
                <h1 className="font-headings text-h2 font-semibold text-white">
                  {plzStats?.count != null
                    ? `Du bist die ${plzStats.count}. Person aus ${plzStats.districtName ?? plzStats.city ?? state.location?.city ?? 'deiner Region'} die mitgemacht hat.`
                    : `Du bist eine Person aus ${state.location?.city ?? 'deiner Region'} die mitgemacht hat.`}
                </h1>
              </div>
              <p className="font-body text-body text-white">
                Danke für deine Unterstützung. Wir leiten die Ergebnisse an deine Stadt weiter.
                Gemeinsam stoßen wir Veränderung an.
              </p>
            </div>
          </div>
          <div className="flex flex-row gap-4 text-body-md">
            {/* card heat color */}
            <div
              style={{ backgroundColor: problemIndexColor, color: problemIndexTextColor }}
              className={`w-full aspect-square md:size-40 rounded-3xl p-4 flex flex-col justify-between ${
                problemIndexTextColor === 'black' ? 'text-black' : 'text-white'
              }`}
            >
              <p>°</p>
              <p>So wäre dein Hitzegefühl als Farbe</p>
            </div>
            {/* card hot days */}
            <div className="bg-white w-full aspect-square md:size-40 rounded-3xl p-4 flex flex-col justify-between">
              <span>°</span>
              <div>
                <p className="text-h5 font-mono font-normal pb-2">12-18</p>
                <p>Tage im Jahr ist dir zu heiß</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results content */}
      <div className="container">
        <div className="inner-container py-16 md:py-28 space-y-6">
          <div>
            <h2 className="mb-4 text-h1 uppercase">Das kannst du jetzt tun</h2>
            <p className="text-body-sm text-muted-foreground">
              Basierend auf deinen Antworten hat unsere KI dir folgende Vorschläge zusammengefasst.
            </p>
          </div>
          <AIRecommendationCTA />
        </div>
      </div>

      <div className="my-12">
        <HeatmapBlockComponent
          blockType="heatmap"
          headline="so ist die Hitze-verteilung in Köln im Sommer 2026"
        />
      </div>

      <div className="inner-container my-12">
        <Button variant="default" size="lg">
          <Link href="/questionnaire/hitze">Neue Umfrage starten</Link>
        </Button>
      </div>
    </div>
  )
}
