import { getPayloadClient } from '@/lib/payload'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { notFound, redirect } from 'next/navigation'
import QuestionClient from './QuestionClient'
import { mapPayloadQuestionToFrontend } from '../../mapQuestion'

import type { Question as PayloadQuestion, UiCopy } from '@/payload-types'

export const revalidate = 600

type Args = {
  params: Promise<{
    name: string
    step: string
  }>
}

export default async function QuestionPage({ params: paramsPromise }: Args) {
  const { name: nameParam, step } = await paramsPromise
  const stepNumber = parseInt(step, 10)

  if (isNaN(stepNumber) || stepNumber < 1) {
    notFound()
  }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'questionnaires',
    where:
      nameParam === 'current'
        ? { isCurrent: { equals: true } }
        : { name: { equals: nameParam } },
    limit: 1,
    depth: 1,
  })
  const questionnaire = docs[0]
  if (!questionnaire?.questions?.length) {
    notFound()
  }

  const questionnaireName = questionnaire.name ?? nameParam
  if (nameParam === 'current' && questionnaireName !== 'current') {
    redirect(`/questionnaire/${questionnaireName}/${step}`)
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
      questionnaireName={questionnaireName}
      question={currentQuestion}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      questionTypes={questionTypes}
      nextButtonText={uiCopy?.questionnaire?.nextButton || 'Weiter'}
      previousButtonText={uiCopy?.questionnaire?.previousButton || 'Zurück'}
    />
  )
}
