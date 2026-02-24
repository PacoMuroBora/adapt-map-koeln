import { getPayloadClient } from '@/lib/payload'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { notFound, redirect } from 'next/navigation'
import QuestionClient from './QuestionClient'
import SectionCoverView from './SectionCoverView'
import { mapPayloadQuestionToFrontend } from '../../mapQuestion'
import {
  getQuestionnairePageByIndex,
  getQuestionnaireTotalPages,
  hasSections,
} from '../../getQuestionnairePageByIndex'

import type { Question as PayloadQuestion, UiCopy } from '@/payload-types'

export const revalidate = 600

type Args = {
  params: Promise<{
    name: string
    step: string
  }>
}

function ensurePayloadQuestion(q: unknown): q is PayloadQuestion {
  return typeof q === 'object' && q !== null && 'key' in (q as object)
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
    depth: 2,
  })
  const questionnaire = docs[0]
  if (!questionnaire) {
    notFound()
  }

  const questionnaireName = questionnaire.name ?? nameParam
  if (nameParam === 'current' && questionnaireName !== 'current') {
    redirect(`/questionnaire/${questionnaireName}/${step}`)
  }

  const useSections = hasSections(questionnaire)

  if (useSections) {
    const totalSteps = getQuestionnaireTotalPages(questionnaire)
    if (stepNumber > totalSteps) {
      notFound()
    }
    const resolved = getQuestionnairePageByIndex(questionnaire, stepNumber)
    if (!resolved) {
      notFound()
    }
    const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy
    const nextButtonText = uiCopy?.questionnaire?.nextButton || 'Weiter'
    const previousButtonText = uiCopy?.questionnaire?.previousButton || 'Zurück'

    if (resolved.type === 'section-cover') {
      return (
        <SectionCoverView
          questionnaireName={questionnaireName}
          sectionIndex={resolved.sectionIndex}
          sectionTitle={resolved.section.sectionTitle}
          sectionSubtitle={resolved.section.sectionSubtitle ?? undefined}
          colorCardProgress={resolved.section.colorCardProgress ?? undefined}
          colorCardBg={resolved.section.colorCardBg ?? undefined}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          nextButtonText={nextButtonText}
        />
      )
    }

    const rawStepQuestions = Array.isArray(resolved.step.questions)
      ? resolved.step.questions.filter(
          (q): q is PayloadQuestion => typeof q === 'object' && q !== null && 'key' in q,
        )
      : []
    const questions = rawStepQuestions.map(mapPayloadQuestionToFrontend)
    if (questions.length === 0) {
      notFound()
    }
    const questionTypes = questions.map((q) => q.type)
    const stepTitle = resolved.step.stepTitle ?? undefined

    return (
      <QuestionClient
        questionnaireName={questionnaireName}
        questions={questions}
        stepTitle={stepTitle}
        stepDescription={undefined}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        questionTypes={questionTypes}
        nextButtonText={nextButtonText}
        previousButtonText={previousButtonText}
        sectionColors={{
          cardProgress: resolved.section.colorCardProgress ?? '#6366f1',
          cardBg: resolved.section.colorCardBg ?? '#e0e7ff',
        }}
        sectionStepsTotal={
          Array.isArray(resolved.section.steps) && resolved.section.steps.length > 0
            ? resolved.section.steps.length
            : undefined
        }
        sectionStepNumber={
          Array.isArray(resolved.section.steps) && resolved.section.steps.length > 0
            ? resolved.stepIndex + 1
            : undefined
        }
      />
    )
  }

  const steps = questionnaire.steps
  const legacyQuestions = questionnaire.questions
  const useSteps = Array.isArray(steps) && steps.length > 0

  let totalSteps: number
  let stepTitle: string | undefined
  let stepDescription: string | undefined
  let questions: ReturnType<typeof mapPayloadQuestionToFrontend>[]

  if (useSteps && steps) {
    totalSteps = steps.length
    if (stepNumber > totalSteps) {
      notFound()
    }
    const stepEntry = steps[stepNumber - 1]
    if (!stepEntry || typeof stepEntry !== 'object') {
      notFound()
    }
    const stepQuestions = (stepEntry as { questions?: unknown[] }).questions
    const rawStepQuestions = Array.isArray(stepQuestions)
      ? stepQuestions.filter(ensurePayloadQuestion)
      : []
    questions = rawStepQuestions.map(mapPayloadQuestionToFrontend)
    stepTitle = (stepEntry as { stepTitle?: string }).stepTitle
    stepDescription = (stepEntry as { stepDescription?: string }).stepDescription
    if (questions.length === 0) {
      notFound()
    }
  } else {
    const rawQuestions = Array.isArray(legacyQuestions)
      ? legacyQuestions.filter(ensurePayloadQuestion)
      : []
    questions = rawQuestions.map(mapPayloadQuestionToFrontend)
    totalSteps = questions.length
    if (totalSteps === 0 || stepNumber > totalSteps) {
      notFound()
    }
    const currentQuestion = questions[stepNumber - 1]
    if (!currentQuestion) {
      notFound()
    }
    questions = [currentQuestion]
    stepTitle = currentQuestion.title
    stepDescription = currentQuestion.description
  }

  const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy
  const questionTypes = questions.map((q) => q.type)

  return (
    <QuestionClient
      questionnaireName={questionnaireName}
      questions={questions}
      stepTitle={stepTitle}
      stepDescription={stepDescription}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      questionTypes={questionTypes}
      nextButtonText={uiCopy?.questionnaire?.nextButton || 'Weiter'}
      previousButtonText={uiCopy?.questionnaire?.previousButton || 'Zurück'}
    />
  )
}
