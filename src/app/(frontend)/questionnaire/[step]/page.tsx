import { getCachedGlobal } from '@/utilities/getGlobals'
import { notFound } from 'next/navigation'
import QuestionClient from './QuestionClient'
import { QUESTIONS } from '../questions'

import type { UiCopy } from '@/payload-types'

export const revalidate = 600

type Args = {
  params: Promise<{
    step: string
  }>
}

export default async function QuestionPage({ params: paramsPromise }: Args) {
  const { step } = await paramsPromise
  const stepNumber = parseInt(step, 10)

  if (isNaN(stepNumber) || stepNumber < 1) {
    notFound()
  }

  const totalSteps = QUESTIONS.length

  // Validate step number is within range
  if (stepNumber > totalSteps) {
    notFound()
  }

  const currentQuestion = QUESTIONS[stepNumber - 1]

  if (!currentQuestion) {
    notFound()
  }

  // Get UI copy for buttons
  const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy

  return (
    <QuestionClient
      question={currentQuestion}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      nextButtonText={uiCopy?.questionnaire?.nextButton || 'Weiter'}
      previousButtonText={uiCopy?.questionnaire?.previousButton || 'Zurück'}
    />
  )
}
