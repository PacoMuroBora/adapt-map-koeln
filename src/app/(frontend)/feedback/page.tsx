'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSubmission } from '@/providers/Submission'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const MAX_LENGTH = 2000

export default function FeedbackPage() {
  const router = useRouter()
  const { state, updateUserText, updateCurrentStep } = useSubmission()
  const [text, setText] = useState(state.userText || '')
  const remaining = MAX_LENGTH - text.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUserText(text)
    updateCurrentStep('results')
    router.push('/results')
  }

  const handleSkip = () => {
    updateUserText('')
    updateCurrentStep('results')
    router.push('/results')
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Zusätzliche Kommentare</h1>
          <p className="text-muted-foreground">
            Haben Sie noch weitere Anmerkungen oder Kommentare? Dieses Feld ist optional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <span className={remaining < 50 ? 'text-destructive' : ''}>{remaining} verbleibend</span>
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
              <Button type="button" variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
                Überspringen
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Weiter
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

