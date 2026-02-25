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

/** Follow-up step after a step with conditions; question is resolved on client from answer. */
export type ResolvedConditionalStep = {
  type: 'conditional-step'
  sectionIndex: number
  /** Index of the parent step (the one whose answer drives the condition). */
  stepIndex: number
  step: SectionStep
  section: Section
  conditions: NonNullable<SectionStep['conditions']>
}

export type ResolvedPage = ResolvedSectionCover | ResolvedStep | ResolvedConditionalStep

/**
 * Number of flat slots for a section: 1 cover + each step + 1 extra per step that has conditions.
 */
export function getSectionExpandedStepCount(section: Section): number {
  const steps = Array.isArray(section.steps) ? section.steps : []
  let count = 0
  for (const step of steps) {
    count += 1
    const conds = step?.conditions
    if (Array.isArray(conds) && conds.length > 0) count += 1
  }
  return count
}

/**
 * Compute total number of flat pages (section covers + steps, including conditional follow-up steps).
 * Page 1 = first section cover, page 2+ = steps. Steps with conditions add one extra page each.
 * Legacy: if no sections, returns legacy steps length (no section covers).
 */
export function getQuestionnaireTotalPages(questionnaire: Questionnaire): number {
  const sections = questionnaire.sections
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.reduce(
      (acc, sec) => acc + 1 + getSectionExpandedStepCount(sec),
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
 * Resolve a flat 1-based page index to a section cover, a normal step, or a conditional follow-up step.
 * Conditional steps appear after steps that have a non-empty conditions array.
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
    const steps = Array.isArray(section.steps) ? section.steps : []
    if (remaining === 1) {
      return { type: 'section-cover', sectionIndex: si, section }
    }
    remaining -= 1
    let stepIndex = 0
    for (const step of steps) {
      if (!step || typeof step !== 'object') continue
      if (remaining === 1) {
        return { type: 'step', sectionIndex: si, stepIndex, step, section }
      }
      remaining -= 1
      const conds = step.conditions
      if (Array.isArray(conds) && conds.length > 0) {
        if (remaining === 1) {
          return {
            type: 'conditional-step',
            sectionIndex: si,
            stepIndex,
            step,
            section,
            conditions: conds,
          }
        }
        remaining -= 1
      }
      stepIndex += 1
    }
  }
  return null
}

/**
 * 1-based expanded step number within a section (for progress: "step X of Y").
 * Use when resolved page is a step or conditional-step.
 */
export function getExpandedStepNumberInSection(
  section: Section,
  stepIndex: number,
  isConditionalStep: boolean,
): number {
  const steps = Array.isArray(section.steps) ? section.steps : []
  let n = 0
  for (let i = 0; i < stepIndex; i++) {
    n += 1
    const conds = steps[i]?.conditions
    if (Array.isArray(conds) && conds.length > 0) n += 1
  }
  n += 1
  if (isConditionalStep) n += 1
  return n
}

/**
 * Whether this questionnaire uses the new section-based flow (has sections).
 */
export function hasSections(questionnaire: Questionnaire): boolean {
  return Array.isArray(questionnaire.sections) && questionnaire.sections.length > 0
}
