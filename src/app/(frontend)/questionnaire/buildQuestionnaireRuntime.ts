import type { Questionnaire as PayloadQuestionnaire, Question as PayloadQuestion } from '@/payload-types'
import type { Question } from './questions'
import { mapPayloadQuestionToFrontend } from './mapQuestion'
import {
  getQuestionnairePageByIndex,
  getQuestionnaireTotalPages,
  getSectionExpandedStepCount,
  getExpandedStepNumberInSection,
  hasSections,
} from './getQuestionnairePageByIndex'

type Section = NonNullable<PayloadQuestionnaire['sections']>[number]

function ensurePayloadQuestion(q: unknown): q is PayloadQuestion {
  return typeof q === 'object' && q !== null && 'key' in (q as object)
}

export type ConditionalStepCondition = {
  showWhenAnswerValue: string
  question: Question
}

export type RuntimeSectionCoverPage = {
  type: 'section-cover'
  sectionIndex: number
  sectionTitle: string
  sectionSubtitle?: string
  colorSection: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
  sectionFigure: 'shape01' | 'shape02'
  sectionsProgress?: { stepsCount: number; variant: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise' }[]
  currentSectionIndex: number
}

export type RuntimeStepPage = {
  type: 'step'
  sectionIndex: number
  stepIndex: number
  questions: Question[]
  questionTypes: Question['type'][]
  colorSection?: string
  sectionStepsTotal: number
  sectionStepNumber: number
  sectionsProgress?: { stepsCount: number; variant: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise' }[]
  currentSectionIndex: number
}

export type RuntimeConditionalStepPage = {
  type: 'conditional-step'
  sectionIndex: number
  stepIndex: number
  parentQuestionKey: string
  conditions: ConditionalStepCondition[]
  colorSection?: string
  sectionStepsTotal: number
  sectionStepNumber: number
  sectionsProgress?: { stepsCount: number; variant: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise' }[]
  currentSectionIndex: number
}

export type RuntimePage = RuntimeSectionCoverPage | RuntimeStepPage | RuntimeConditionalStepPage

export type QuestionnaireRuntime = {
  questionnaireName: string
  totalSteps: number
  nextButtonText: string
  previousButtonText: string
  pages: RuntimePage[]
  allStepQuestionTypes: Question['type'][][]
  startView: {
    instructionTitle?: string
    instructionItems: string[]
    overline?: string
    title?: string
    totalSteps: number
    useInstructionScreen: boolean
  }
}

function buildAllStepQuestionTypes(
  questionnaire: PayloadQuestionnaire,
  totalSteps: number,
): Question['type'][][] {
  const out: Question['type'][][] = []
  for (let i = 1; i <= totalSteps; i++) {
    const resolved = getQuestionnairePageByIndex(questionnaire, i)
    if (resolved?.type === 'step') {
      const q = resolved.step.question
      const raw =
        q && typeof q === 'object' && q !== null && 'key' in q ? [q as PayloadQuestion] : []
      const mapped = raw.map(mapPayloadQuestionToFrontend)
      out.push(mapped.length > 0 ? [mapped[0].type] : [])
    } else if (resolved?.type === 'conditional-step') {
      const types = (resolved.conditions ?? [])
        .map((c) => {
          const condQ =
            c && typeof c === 'object' && 'conditional question' in c
              ? (c as { 'conditional question': unknown })['conditional question']
              : null
          const payloadQ =
            condQ && typeof condQ === 'object' && condQ !== null && 'key' in condQ
              ? (condQ as PayloadQuestion)
              : null
          return payloadQ ? mapPayloadQuestionToFrontend(payloadQ).type : null
        })
        .filter((t): t is Question['type'] => t != null)
      out.push(types.length > 0 ? types : [])
    } else {
      out.push([])
    }
  }
  return out
}

function buildSectionsProgress(questionnaire: PayloadQuestionnaire): RuntimeStepPage['sectionsProgress'] {
  const sections = questionnaire.sections
  if (!Array.isArray(sections) || sections.length === 0) return undefined
  return sections.map((s) => ({
    stepsCount: getSectionExpandedStepCount(s),
    variant: s.colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
  }))
}

/**
 * Build a flat runtime model from a CMS questionnaire. Used once per request to render
 * the questionnaire client; all step transitions then use this model without further fetches.
 */
export function buildQuestionnaireRuntime(
  questionnaire: PayloadQuestionnaire,
  questionnaireName: string,
  nextButtonText: string,
  previousButtonText: string,
): QuestionnaireRuntime | null {
  const useSections = hasSections(questionnaire)
  const totalSteps = getQuestionnaireTotalPages(questionnaire)
  if (totalSteps === 0 && !useSections) return null

  const instructionItems =
    Array.isArray(questionnaire.instructionItems) && questionnaire.instructionItems.length > 0
      ? questionnaire.instructionItems
          .map((i) => (i && typeof i === 'object' ? i.item : ''))
          .filter(Boolean)
      : []

  const startView = {
    instructionTitle: questionnaire.instructionTitle ?? undefined,
    instructionItems,
    overline: questionnaire.overline ?? undefined,
    title: questionnaire.title ?? undefined,
    totalSteps,
    useInstructionScreen: useSections && Boolean(questionnaire.instructionTitle != null),
  }

  if (!useSections) {
    const legacySteps = questionnaire.steps
    const legacyQuestions = questionnaire.questions
    const useSteps = Array.isArray(legacySteps) && legacySteps.length > 0
    const pages: RuntimePage[] = []
    const allStepQuestionTypes: Question['type'][][] = []

    if (useSteps && legacySteps) {
      for (let i = 0; i < legacySteps.length; i++) {
        const stepEntry = legacySteps[i]
        if (!stepEntry || typeof stepEntry !== 'object') continue
        const stepQuestions = (stepEntry as { questions?: unknown[] }).questions
        const rawStepQuestions = Array.isArray(stepQuestions)
          ? stepQuestions.filter(ensurePayloadQuestion)
          : []
        const mapped = rawStepQuestions.map(mapPayloadQuestionToFrontend)
        if (mapped.length === 0) continue
        allStepQuestionTypes.push([mapped[0].type])
        pages.push({
          type: 'step',
          sectionIndex: 0,
          stepIndex: i,
          questions: [mapped[0]],
          questionTypes: [mapped[0].type],
          sectionStepsTotal: legacySteps.length,
          sectionStepNumber: i + 1,
          currentSectionIndex: 0,
        })
      }
    } else if (Array.isArray(legacyQuestions) && legacyQuestions.length > 0) {
      const raw = legacyQuestions.filter(ensurePayloadQuestion)
      const allMapped = raw.map(mapPayloadQuestionToFrontend)
      for (let i = 0; i < allMapped.length; i++) {
        const q = allMapped[i]
        if (!q) continue
        allStepQuestionTypes.push([q.type])
        pages.push({
          type: 'step',
          sectionIndex: 0,
          stepIndex: i,
          questions: [q],
          questionTypes: [q.type],
          sectionStepsTotal: allMapped.length,
          sectionStepNumber: i + 1,
          currentSectionIndex: 0,
        })
      }
    }

    return {
      questionnaireName,
      totalSteps,
      nextButtonText,
      previousButtonText,
      pages,
      allStepQuestionTypes,
      startView,
    }
  }

  const sectionsProgress = buildSectionsProgress(questionnaire)
  const allStepQuestionTypes = buildAllStepQuestionTypes(questionnaire, totalSteps)
  const pages: RuntimePage[] = []

  for (let flatIndex = 1; flatIndex <= totalSteps; flatIndex++) {
    const resolved = getQuestionnairePageByIndex(questionnaire, flatIndex)
    if (!resolved) continue

    if (resolved.type === 'section-cover') {
      pages.push({
        type: 'section-cover',
        sectionIndex: resolved.sectionIndex,
        sectionTitle: resolved.section.sectionTitle,
        sectionSubtitle: resolved.section.sectionSubtitle ?? undefined,
        colorSection: resolved.section.colorSection,
        sectionFigure: (resolved.section.sectionFigure as 'shape01' | 'shape02') ?? 'shape01',
        sectionsProgress,
        currentSectionIndex: resolved.sectionIndex,
      })
      continue
    }

    if (resolved.type === 'conditional-step') {
      const parentQuestion = resolved.step.question
      const parentKey =
        parentQuestion && typeof parentQuestion === 'object' && 'key' in parentQuestion
          ? (parentQuestion as PayloadQuestion).key
          : null
      if (!parentKey) continue
      const conditionsWithMapped: ConditionalStepCondition[] = (resolved.conditions ?? [])
        .map((c) => {
          const condQ =
            c && typeof c === 'object' && 'conditional question' in c
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
        .filter((x): x is ConditionalStepCondition => x != null)
      if (conditionsWithMapped.length === 0) continue

      const sectionStepsTotal = getSectionExpandedStepCount(resolved.section)
      const sectionStepNumber = getExpandedStepNumberInSection(
        resolved.section,
        resolved.stepIndex,
        true,
      )
      pages.push({
        type: 'conditional-step',
        sectionIndex: resolved.sectionIndex,
        stepIndex: resolved.stepIndex,
        parentQuestionKey: parentKey,
        conditions: conditionsWithMapped,
        colorSection: resolved.section.colorSection ?? undefined,
        sectionStepsTotal,
        sectionStepNumber,
        sectionsProgress,
        currentSectionIndex: resolved.sectionIndex,
      })
      continue
    }

    if (resolved.type === 'step') {
      const stepQuestion = resolved.step.question
      const rawStepQuestions =
        stepQuestion && typeof stepQuestion === 'object' && stepQuestion !== null && 'key' in stepQuestion
          ? [stepQuestion as PayloadQuestion]
          : []
      const mapped = rawStepQuestions.map(mapPayloadQuestionToFrontend)
      if (mapped.length === 0) continue
      const sectionStepsTotal = getSectionExpandedStepCount(resolved.section)
      const sectionStepNumber = getExpandedStepNumberInSection(
        resolved.section,
        resolved.stepIndex,
        false,
      )
      pages.push({
        type: 'step',
        sectionIndex: resolved.sectionIndex,
        stepIndex: resolved.stepIndex,
        questions: [mapped[0]],
        questionTypes: [mapped[0].type],
        colorSection: resolved.section.colorSection ?? undefined,
        sectionStepsTotal,
        sectionStepNumber,
        sectionsProgress,
        currentSectionIndex: resolved.sectionIndex,
      })
    }
  }

  return {
    questionnaireName,
    totalSteps,
    nextButtonText,
    previousButtonText,
    pages,
    allStepQuestionTypes,
    startView,
  }
}
