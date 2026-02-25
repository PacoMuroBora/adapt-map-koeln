'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HeatmapMap } from '@/components/HeatmapMap'
import { useSubmission } from '@/providers/Submission'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function HeatmapPage() {
  const { state } = useSubmission()

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Heatmap</h1>
          <p className="text-muted-foreground">
            Raster-Heatmap der hitzebezogenen Probleme. Jede Kachel zeigt die durchschnittliche
            Problem-Index-Farbe (0–100). Kachelgröße und weitere Einstellungen sind in den
            Site-Einstellungen festgelegt. Fahre mit der Maus über eine Kachel oder tippe darauf, um
            die Verteilung der Werte zu sehen.
          </p>
        </div>

        <Card className="relative h-[600px] w-full overflow-hidden">
          <HeatmapMap userLocation={state.location} className="h-full w-full" />
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
