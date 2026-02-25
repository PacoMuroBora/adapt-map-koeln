import { getPayloadClient } from '@/lib/payload'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { notFound, redirect } from 'next/navigation'
import QuestionClient from './QuestionClient'
import SectionCoverView from './SectionCoverView'
import { mapPayloadQuestionToFrontend } from '../../mapQuestion'
import {
  getQuestionnairePageByIndex,
  getQuestionnaireTotalPages,
  getSectionExpandedStepCount,
  getExpandedStepNumberInSection,
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
      const sectionsProgress = Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
        ? questionnaire.sections.map((s) => ({
            stepsCount: getSectionExpandedStepCount(s),
            variant: s.colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
          }))
        : undefined
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
          sectionsProgress={sectionsProgress}
          currentSectionIndex={resolved.sectionIndex}
        />
      )
    }

    // Conditional follow-up step: question resolved on client from parent answer
    if (resolved.type === 'conditional-step') {
      const parentQuestion = resolved.step.question
      const parentKey =
        parentQuestion && typeof parentQuestion === 'object' && 'key' in parentQuestion
          ? (parentQuestion as PayloadQuestion).key
          : null
      if (!parentKey) notFound()
      const conditionsWithMapped = (resolved.conditions ?? [])
        .map((c) => {
          const condQ = c && typeof c === 'object' && 'conditional question' in c
            ? (c as { 'conditional question': unknown })['conditional question']
            : null
          const payloadQ =
            condQ && typeof condQ === 'object' && condQ !== null && 'key' in condQ
              ? (condQ as PayloadQuestion)
              : null
          if (!payloadQ || !c) return null
          return {
            showWhenAnswerValue: (c as { showWhenAnswerValue: string }).showWhenAnswerValue,
            question: mapPayloadQuestionToFrontend(payloadQ),
          }
        })
        .filter((x): x is { showWhenAnswerValue: string; question: ReturnType<typeof mapPayloadQuestionToFrontend> } => x != null)
      const conditionalStepConfig =
        conditionsWithMapped.length > 0
          ? { parentQuestionKey: parentKey, conditions: conditionsWithMapped }
          : undefined

      const allStepQuestionTypes: ReturnType<typeof mapPayloadQuestionToFrontend>['type'][][] = []
      for (let i = 1; i <= totalSteps; i++) {
        const pageResolved = getQuestionnairePageByIndex(questionnaire, i)
        if (pageResolved?.type === 'step') {
          const q = pageResolved.step.question
          const raw =
            q && typeof q === 'object' && q !== null && 'key' in q ? [q as PayloadQuestion] : []
          const mapped = raw.map(mapPayloadQuestionToFrontend)
          allStepQuestionTypes.push(mapped.length > 0 ? [mapped[0].type] : [])
        } else if (pageResolved?.type === 'conditional-step') {
          const types = (pageResolved.conditions ?? [])
            .map((c) => {
              const condQ = c && typeof c === 'object' && 'conditional question' in c
                ? (c as { 'conditional question': unknown })['conditional question']
                : null
              const payloadQ =
                condQ && typeof condQ === 'object' && condQ !== null && 'key' in condQ
                  ? (condQ as PayloadQuestion)
                  : null
              return payloadQ ? mapPayloadQuestionToFrontend(payloadQ).type : null
            })
            .filter((t): t is NonNullable<typeof t> => t != null)
          allStepQuestionTypes.push(types.length > 0 ? types : [])
        } else {
          allStepQuestionTypes.push([])
        }
      }

      const sectionStepsTotal = getSectionExpandedStepCount(resolved.section)
      const sectionStepNumber = getExpandedStepNumberInSection(
        resolved.section,
        resolved.stepIndex,
        true,
      )
      const sectionsProgress = Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
        ? questionnaire.sections.map((s) => ({
            stepsCount: getSectionExpandedStepCount(s),
            variant: s.colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
          }))
        : undefined

      return (
        <QuestionClient
          questionnaireName={questionnaireName}
          questions={[]}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          questionTypes={[]}
          allStepQuestionTypes={allStepQuestionTypes}
          nextButtonText={nextButtonText}
          previousButtonText={previousButtonText}
          colorSection={resolved.section.colorSection ?? undefined}
          sectionStepsTotal={sectionStepsTotal}
          sectionStepNumber={sectionStepNumber}
          sectionsProgress={sectionsProgress}
          currentSectionIndex={resolved.sectionIndex}
          conditionalStepConfig={conditionalStepConfig}
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
      } else if (pageResolved?.type === 'conditional-step') {
        const types = (pageResolved.conditions ?? [])
          .map((c) => {
            const condQ = c && typeof c === 'object' && 'conditional question' in c
              ? (c as { 'conditional question': unknown })['conditional question']
              : null
            const payloadQ =
              condQ && typeof condQ === 'object' && condQ !== null && 'key' in condQ
                ? (condQ as PayloadQuestion)
                : null
            return payloadQ ? mapPayloadQuestionToFrontend(payloadQ).type : null
          })
          .filter((t): t is NonNullable<typeof t> => t != null)
        allStepQuestionTypes.push(types.length > 0 ? types : [])
      } else {
        allStepQuestionTypes.push([])
      }
    }

    const sectionStepsTotal = getSectionExpandedStepCount(resolved.section)
    const sectionStepNumber = getExpandedStepNumberInSection(
      resolved.section,
      resolved.stepIndex,
      false,
    )
    const sectionsProgress = Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
      ? questionnaire.sections.map((s) => ({
          stepsCount: getSectionExpandedStepCount(s),
          variant: s.colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
        }))
      : undefined

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
        sectionStepsTotal={sectionStepsTotal}
        sectionStepNumber={sectionStepNumber}
        sectionsProgress={sectionsProgress}
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
