import { getPayloadClient } from '@/lib/payload'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { notFound } from 'next/navigation'
import QuestionClient from './QuestionClient'
import { mapPayloadQuestionToFrontend } from '../mapQuestion'

import type { Question as PayloadQuestion, UiCopy } from '@/payload-types'

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

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'questionnaires',
    where: { isCurrent: { equals: true } },
    limit: 1,
    depth: 1,
  })
  const questionnaire = docs[0]
  if (!questionnaire?.questions?.length) {
    notFound()
  }

  const rawQuestions = questionnaire.questions.filter(
    (q): q is PayloadQuestion => typeof q === 'object' && q !== null && 'key' in q,
  )
  const questions = rawQuestions.map(mapPayloadQuestionToFrontend)

  const totalSteps = questions.length
  if (stepNumber > totalSteps) {
    notFound()
  }

  const currentQuestion = questions[stepNumber - 1]
  if (!currentQuestion) {
    notFound()
  }

  const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy

  const questionTypes = questions.map((q) => q.type)

  return (
    <QuestionClient
      question={currentQuestion}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      questionTypes={questionTypes}
      nextButtonText={uiCopy?.questionnaire?.nextButton || 'Weiter'}
      previousButtonText={uiCopy?.questionnaire?.previousButton || 'Zurück'}
    />
  )
}
