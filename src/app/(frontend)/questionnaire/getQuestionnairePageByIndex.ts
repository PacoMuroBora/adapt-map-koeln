import type { Questionnaire } from '@/payload-types'

type Section = NonNullable<Questionnaire['sections']>[number]
type SectionStep = Section['steps'][number]

export type ResolvedSectionCover = {
  type: 'section-cover'
  sectionIndex: number
  section: Section
}

export type ResolvedStep = {
  type: 'step'
  sectionIndex: number
  stepIndex: number
  step: SectionStep
  section: Section
}

export type ResolvedPage = ResolvedSectionCover | ResolvedStep

/**
 * Compute total number of flat pages (section covers + steps) for a questionnaire.
 * Page 0 = welcome (no step in URL). Page 1 = first section cover, page 2+ = steps.
 * Legacy: if no sections, returns legacy steps length (no section covers).
 */
export function getQuestionnaireTotalPages(questionnaire: Questionnaire): number {
  const sections = questionnaire.sections
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.reduce(
      (acc, sec) => acc + 1 + (Array.isArray(sec.steps) ? sec.steps.length : 0),
      0,
    )
  }
  const legacySteps = questionnaire.steps
  const legacyQuestions = questionnaire.questions
  if (Array.isArray(legacySteps) && legacySteps.length > 0) {
    return legacySteps.length
  }
  if (Array.isArray(legacyQuestions) && legacyQuestions.length > 0) {
    return legacyQuestions.length
  }
  return 0
}

/**
 * Resolve a flat 1-based page index to either a section cover or a step.
 * Page 1 = first section cover, page 2 = first section first step, etc.
 * Returns null if index is out of range or questionnaire has no sections (use legacy flow).
 */
export function getQuestionnairePageByIndex(
  questionnaire: Questionnaire,
  flatPageIndex: number,
): ResolvedPage | null {
  const sections = questionnaire.sections
  if (!Array.isArray(sections) || sections.length === 0) {
    return null
  }
  let remaining = flatPageIndex
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si]
    if (!section || typeof section !== 'object') continue
    const stepCount = Array.isArray(section.steps) ? section.steps.length : 0
    if (remaining === 1) {
      return { type: 'section-cover', sectionIndex: si, section }
    }
    remaining -= 1
    if (remaining <= stepCount) {
      const stepIndex = remaining - 1
      const step = section.steps?.[stepIndex]
      if (step) {
        return { type: 'step', sectionIndex: si, stepIndex, step, section }
      }
      return null
    }
    remaining -= stepCount
  }
  return null
}

/**
 * Whether this questionnaire uses the new section-based flow (has sections).
 */
export function hasSections(questionnaire: Questionnaire): boolean {
  return Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
}
