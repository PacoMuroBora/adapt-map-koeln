'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubmission } from '@/providers/Submission'
import { Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export default function HeatmapPage() {
  const { state } = useSubmission()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // This will be replaced with actual map integration in task 6
    // For now, just simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Heatmap</h1>
          <p className="text-muted-foreground">
            Visualisierung der hitzebezogenen Probleme nach Postleitzahl. Die Intensität zeigt die
            durchschnittliche Problembelastung.
          </p>
        </div>

        <Card className="relative h-[600px] w-full overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Heatmap wird geladen...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="mb-4 text-destructive">{error}</p>
                <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">Karte wird hier angezeigt</p>
                <p className="text-sm text-muted-foreground">
                  Die MapLibre-Integration wird in Aufgabe 6 implementiert.
                </p>
              </div>
            </div>
          )}
        </Card>

        {state.location && (
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Ihr Standort</p>
                <p className="text-sm text-muted-foreground">
                  {state.location.postal_code && `PLZ: ${state.location.postal_code}`}
                  {state.location.city && `, ${state.location.city}`}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Legende</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-500" />
              <span className="text-sm">Niedrig (0-40)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-yellow-500" />
              <span className="text-sm">Mittel (40-70)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-500" />
              <span className="text-sm">Hoch (70-100)</span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Zur Startseite</Link>
          </Button>
          {state.submissionId && (
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
              <Link href="/results">Meine Ergebnisse anzeigen</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

