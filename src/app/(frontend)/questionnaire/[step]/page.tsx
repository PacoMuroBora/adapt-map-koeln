import { Button } from '@/components/ui/button'
import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import QuestionClient from './QuestionClient'

import type { Questionnaire, UiCopy } from '@/payload-types'

export const revalidate = 600

type Args = {
  params: Promise<{
    step: string
  }>
}

export default async function QuestionPage({ params: paramsPromise }: Args) {
  const { step } = await paramsPromise
  const stepNumber = parseInt(step, 10)

  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 10) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })

  // Get current questionnaire
  const questionnaires = await payload.find({
    collection: 'questionnaires',
    where: {
      isCurrent: { equals: true },
      status: { equals: 'active' },
    },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })

  if (!questionnaires.docs.length) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="rounded-lg border bg-card p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Wartungsmodus</h1>
          <p className="text-muted-foreground">
            Derzeit ist kein aktiver Fragebogen verfügbar. Bitte versuchen Sie es später erneut.
          </p>
        </div>
      </div>
    )
  }

  const questionnaire = questionnaires.docs[0] as Questionnaire

  // Ensure we have exactly 10 questions
  if (!questionnaire.questions || questionnaire.questions.length !== 10) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="rounded-lg border bg-card p-6 text-center">
          <h1 className="mb-4 text-2xl font-bold">Wartungsmodus</h1>
          <p className="text-muted-foreground">
            Der Fragebogen ist nicht vollständig konfiguriert. Bitte versuchen Sie es später erneut.
          </p>
        </div>
      </div>
    )
  }

  const currentQuestion = Array.isArray(questionnaire.questions)
    ? questionnaire.questions[stepNumber - 1]
    : null

  if (!currentQuestion || typeof currentQuestion === 'string') {
    notFound()
  }

  // Get UI copy for buttons
  const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy

  return (
    <QuestionClient
      question={currentQuestion}
      stepNumber={stepNumber}
      totalSteps={10}
      questionnaireVersion={questionnaire.version || questionnaire.id}
      nextButtonText={uiCopy?.questionnaire?.nextButton || 'Weiter'}
      previousButtonText={uiCopy?.questionnaire?.previousButton || 'Zurück'}
    />
  )
}

