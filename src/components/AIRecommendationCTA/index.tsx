'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSubmission } from '@/providers/Submission'
import { Loader2, Sparkles } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

export function AIRecommendationCTA() {
  const { state, updateAIResults } = useSubmission()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasAutoFetched = useRef(false)

  const fetchRecommendations = React.useCallback(async () => {
    if (!state.submissionId) {
      setError('Keine Submission-ID gefunden. Bitte starte die Umfrage erneut.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: state.submissionId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Fehler bei der Generierung der KI-Empfehlung')
      }

      const data = await response.json()

      updateAIResults({
        aiSummary: data.ai_summary_de,
        aiRecommendations: data.ai_recommendations_de || [],
        aiGeneratedAt: data.ai_generated_at || new Date().toISOString(),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Generierung der KI-Empfehlung')
    } finally {
      setIsLoading(false)
    }
  }, [state.submissionId, updateAIResults])

  // Generate AI recommendations automatically once when we have a submission and no results yet
  useEffect(() => {
    if (
      state.submissionId &&
      !state.aiSummary &&
      !state.aiRecommendations &&
      !hasAutoFetched.current
    ) {
      hasAutoFetched.current = true
      fetchRecommendations()
    }
  }, [state.submissionId, state.aiSummary, state.aiRecommendations, fetchRecommendations])

  // If AI results already exist, show them
  if (state.aiSummary && state.aiRecommendations) {
    return (
      <div className="space-y-2 py-12">
        <p className="text-body-lg text-muted-foreground">{state.aiSummary}</p>
        {state.aiRecommendations && state.aiRecommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-mono uppercase tracking-wide text-body font-normal text-muted">
              Empfehlungen
            </h4>
            <ul className="space-y-4">
              {state.aiRecommendations.map((rec: any, index: number) => {
                const num = String(index + 1).padStart(2, '0')
                return (
                  <li key={index} className="rounded-3xl border border-border p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-muted">
                      <div className="size-1.5 border border-muted rounded-full" />
                      <p className="text-body-sm font-mono font-normal">{num}</p>
                    </div>
                    <h6 className="text-h6 font-sans font-normal uppercase">
                      {rec.title || `Empfehlung ${num}`}
                    </h6>
                    {rec.description && (
                      <p className="mt-1 text-body text-muted-foreground">{rec.description}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {state.aiGeneratedAt && (
          <p className="px-4 text-xs text-muted">
            Generiert am: {new Date(state.aiGeneratedAt).toLocaleString('de-DE')}
          </p>
        )}
      </div>
    )
  }

  // Loading or error state: show loading indicator, or error with retry button
  return (
    <div className="space-y-4 my-12">
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>KI-Empfehlung wird generiert...</span>
        </div>
      )}
      {error && (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={fetchRecommendations} className="w-full sm:w-auto">
            Erneut versuchen
          </Button>
        </>
      )}
    </div>
  )
}
