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
      nameParam === 'current' ? { isCurrent: { equals: true } } : { name: { equals: nameParam } },
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
          colorSection={resolved.section.colorSection ?? undefined}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          nextButtonText={nextButtonText}
          sectionsProgress={
            Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
              ? questionnaire.sections.map((s) => ({
                  stepsCount: Array.isArray(s?.steps) ? s.steps.length : 0,
                  variant: s.colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
                }))
              : undefined
          }
          currentSectionIndex={resolved.sectionIndex}
        />
      )
    }

    const stepQuestion = resolved.step.question
    const rawStepQuestions =
      stepQuestion && typeof stepQuestion === 'object' && stepQuestion !== null && 'key' in stepQuestion
        ? [stepQuestion as PayloadQuestion]
        : []
    const allMapped = rawStepQuestions.map(mapPayloadQuestionToFrontend)
    if (allMapped.length === 0) {
      notFound()
    }
    const questions = [allMapped[0]]
    const questionTypes = questions.map((q) => q.type)

    // Build flat list of question types per step (one question per step) for navigation
    const allStepQuestionTypes: ReturnType<typeof mapPayloadQuestionToFrontend>['type'][][] = []
    for (let i = 1; i <= totalSteps; i++) {
      const pageResolved = getQuestionnairePageByIndex(questionnaire, i)
      if (pageResolved?.type === 'step') {
        const q = pageResolved.step.question
        const raw =
          q && typeof q === 'object' && q !== null && 'key' in q ? [q as PayloadQuestion] : []
        const mapped = raw.map(mapPayloadQuestionToFrontend)
        allStepQuestionTypes.push(mapped.length > 0 ? [mapped[0].type] : [])
      } else {
        allStepQuestionTypes.push([])
      }
    }

    return (
      <QuestionClient
        questionnaireName={questionnaireName}
        questions={questions}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        questionTypes={questionTypes}
        allStepQuestionTypes={allStepQuestionTypes}
        nextButtonText={nextButtonText}
        previousButtonText={previousButtonText}
        colorSection={resolved.section.colorSection ?? undefined}
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
        sectionsProgress={
          Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
            ? questionnaire.sections.map((s) => ({
                stepsCount: Array.isArray(s?.steps) ? s.steps.length : 0,
                variant: s.colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
              }))
            : undefined
        }
        currentSectionIndex={resolved.sectionIndex}
      />
    )
  }

  const steps = questionnaire.steps
  const legacyQuestions = questionnaire.questions
  const useSteps = Array.isArray(steps) && steps.length > 0

  let totalSteps: number
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
    const stepMapped = rawStepQuestions.map(mapPayloadQuestionToFrontend)
    if (stepMapped.length === 0) {
      notFound()
    }
    questions = [stepMapped[0]]
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
  }

  const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy
  const questionTypes = questions.map((q) => q.type)

  return (
    <QuestionClient
      questionnaireName={questionnaireName}
      questions={questions}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      questionTypes={questionTypes}
      nextButtonText={uiCopy?.questionnaire?.nextButton || 'Weiter'}
      previousButtonText={uiCopy?.questionnaire?.previousButton || 'Zurück'}
    />
  )
}
