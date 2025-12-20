'use client'

import { AIRecommendationCTA } from '@/components/AIRecommendationCTA'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubmission } from '@/providers/Submission'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

export default function ResultsPage() {
  const router = useRouter()
  const { state, updateCurrentStep } = useSubmission()

  useEffect(() => {
    // If no submission data, redirect to start
    if (!state.submissionId && (state.problemIndex === null || state.problemIndex === undefined)) {
      router.push('/')
    }
  }, [state, router, updateCurrentStep])

  const problemIndex = state.problemIndex ?? 0
  const severity =
    problemIndex >= 70 ? 'hoch' : problemIndex >= 40 ? 'mittel' : 'niedrig'
  const severityColor =
    problemIndex >= 70 ? 'text-destructive' : problemIndex >= 40 ? 'text-yellow-600' : 'text-green-600'
  const severityIcon =
    problemIndex >= 70 ? (
      <AlertCircle className="h-6 w-6" />
    ) : problemIndex >= 40 ? (
      <Info className="h-6 w-6" />
    ) : (
      <CheckCircle2 className="h-6 w-6" />
    )

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Ihre Ergebnisse</h1>
          <p className="text-muted-foreground">
            Basierend auf Ihren Antworten haben wir einen Hitze-Problem-Index berechnet.
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Hitze-Problem-Index</h2>
              <div className={`flex items-center gap-2 ${severityColor}`}>
                {severityIcon}
                <span className="font-medium capitalize">{severity}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Ihr Wert</span>
                <span className="font-bold">{Math.round(problemIndex)}/100</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${
                    problemIndex >= 70
                      ? 'bg-destructive'
                      : problemIndex >= 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${problemIndex}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                {problemIndex >= 70
                  ? 'Ihr Hitze-Problem-Index ist hoch. Es gibt erhebliche hitzebezogene Probleme in Ihrer Umgebung.'
                  : problemIndex >= 40
                    ? 'Ihr Hitze-Problem-Index ist mittel. Es gibt einige hitzebezogene Herausforderungen.'
                    : 'Ihr Hitze-Problem-Index ist niedrig. Die hitzebezogenen Probleme in Ihrer Umgebung sind gering.'}
              </p>
            </div>
          </div>
        </Card>

        {state.subScores && Object.keys(state.subScores).length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Detaillierte Ergebnisse nach Kategorie</h2>
            <div className="space-y-3">
              {Object.entries(state.subScores).map(([category, score]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">{Math.round(score as number)}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${score as number}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <AIRecommendationCTA />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/heatmap">Heatmap anzeigen</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto sm:ml-auto">
            <Link href="/">Neue Umfrage starten</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

