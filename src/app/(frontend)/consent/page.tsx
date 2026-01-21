'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useSubmission } from '@/providers/Submission'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export default function ConsentPage() {
  const router = useRouter()
  const { state, updateConsent, updateCurrentStep } = useSubmission()
  const [dataCollection, setDataCollection] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!dataCollection) {
      setError('Bitte akzeptieren Sie die Datenerhebung, um fortzufahren.')
      return
    }

    const consentData = {
      dataCollection: true,
      cookieConsent: 'necessary' as const, // Default to necessary only
      consentVersion: '1.0', // TODO: Get from CMS
      timestamp: new Date().toISOString(),
    }

    updateConsent(consentData)
    updateCurrentStep('results')

    // Store cookie consent in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'necessary')
    }

    // Redirect to results after consent
    router.push('/results')
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Einverständniserklärung</h1>
          <p className="text-muted-foreground">
            Bevor Sie Ihre Ergebnisse sehen können, benötigen wir Ihr Einverständnis zur Datenerhebung und
            -verarbeitung.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-6">
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
                  Datenerhebung akzeptieren
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ich stimme der Erhebung und Verarbeitung meiner anonymen Daten für die Zwecke
                  dieser Umfrage zu. Meine Daten werden anonymisiert gespeichert und nur für
                  statistische Zwecke verwendet.
                </p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

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

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/feedback')}
              className="w-full sm:w-auto"
            >
              Zurück
            </Button>
            <Button type="submit" className="w-full sm:w-auto sm:ml-auto">
              Akzeptieren und Ergebnisse anzeigen
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
