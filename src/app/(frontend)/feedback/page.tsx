'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ProgressBar from '@/components/questionnaire/ProgressBar'
import { useSubmission } from '@/providers/Submission'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { STEP_FEEDBACK, TOTAL_STEPS } from '../questionnaire/constants'

const MAX_LENGTH = 2000

export default function FeedbackPage() {
  const router = useRouter()
  const { state, updateUserText, updateConsent, updateCurrentStep, updateResults } = useSubmission()
  const [text, setText] = useState(state.userText || '')
  const [dataCollection, setDataCollection] = useState(state.consent?.dataCollection || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remaining = MAX_LENGTH - text.length

  const submitToAPI = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate consent
      if (!dataCollection) {
        setError('Bitte akzeptieren Sie die Datenerhebung, um fortzufahren.')
        setIsSubmitting(false)
        return
      }

      // Validate required data
      if (
        !state.location ||
        !state.location.lat ||
        !state.location.lng ||
        !state.location.postal_code
      ) {
        throw new Error('Standort fehlt. Bitte kehren Sie zur Standortseite zurück.')
      }

      if (!state.answers || Object.keys(state.answers).length === 0) {
        throw new Error('Keine Antworten gefunden. Bitte beantworten Sie die Fragen.')
      }

      // Update consent in state
      const consentData = {
        dataCollection: true,
        cookieConsent: 'necessary' as const,
        consentVersion: '1.0',
        timestamp: new Date().toISOString(),
      }
      updateConsent(consentData)

      // Store cookie consent in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cookieConsent', 'necessary')
      }

      // Merge location answer with location state
      const locationAnswer = state.answers.location || {}
      const mergedLocation = {
        lat: state.location.lat,
        lng: state.location.lng,
        postal_code: state.location.postal_code,
        city: state.location.city || locationAnswer.city || undefined,
        street: locationAnswer.street || state.location.street || undefined,
      }

      // Prepare submission payload
      const payload = {
        location: mergedLocation,
        questionnaireVersion: state.questionnaireVersion || 'v1.0',
        answers: state.answers,
        personalFields: state.personalFields || undefined,
        freeText: text || undefined,
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Speichern der Antworten')
      }

      const data = await response.json()

      // Update state with results
      updateResults({
        submissionId: data.submissionId,
        problemIndex: data.problemIndex,
        subScores: data.subScores,
      })

      // Update user text
      updateUserText(text)
      updateCurrentStep('results')

      // Redirect to results
      router.push('/results')
    } catch (err) {
      console.error('Submission error:', err)
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitToAPI()
  }

  const handleSkip = async () => {
    // Still need consent even when skipping comments
    if (!dataCollection) {
      setError('Bitte akzeptieren Sie die Datenerhebung, um fortzufahren.')
      return
    }
    updateUserText('')
    await submitToAPI()
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        {/* Progress bar */}
        <ProgressBar currentStep={STEP_FEEDBACK} totalSteps={TOTAL_STEPS} />

        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Zusätzliche Kommentare</h1>
          <p className="text-muted-foreground">
            Haben Sie noch weitere Anmerkungen oder Kommentare? Dieses Feld ist optional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="feedback">Ihre Kommentare (optional)</Label>
            <Textarea
              id="feedback"
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  setText(e.target.value)
                }
              }}
              placeholder="Teilen Sie uns Ihre Gedanken mit..."
              rows={8}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Maximal {MAX_LENGTH} Zeichen</span>
              <span className={remaining < 50 ? 'text-destructive' : ''}>
                {remaining} verbleibend
              </span>
            </div>
          </div>

          {/* Consent Section */}
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Einverständniserklärung</h2>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="data-collection"
                checked={dataCollection}
                onCheckedChange={(checked) => {
                  setDataCollection(checked === true)
                  setError(null)
                }}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="data-collection" className="text-base font-medium leading-none">
                  Datenerhebung akzeptieren <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ich stimme der Erhebung und Verarbeitung meiner anonymen Daten für die Zwecke
                  dieser Umfrage zu. Meine Daten werden anonymisiert gespeichert und nur für
                  statistische Zwecke verwendet.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Weitere Informationen finden Sie in unserer{' '}
                <Link href="/legal/privacy" className="text-primary underline hover:no-underline">
                  Datenschutzerklärung
                </Link>
                .
              </p>
              <p>
                Lesen Sie auch unsere{' '}
                <Link href="/legal/terms" className="text-primary underline hover:no-underline">
                  Nutzungsbedingungen
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Zurück
            </Button>
            <div className="flex gap-4 sm:ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Kommentare überspringen
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Wird gespeichert...' : 'Absenden und Ergebnisse anzeigen'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
