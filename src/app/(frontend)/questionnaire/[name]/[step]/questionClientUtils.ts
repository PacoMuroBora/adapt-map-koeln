import type { Question } from '../../questions'
import { isValidColognePlz } from '@/utilities/colognePlz'

export const STEPS_TO_SKIP_WHEN_GPS = ['plz', 'address'] as const

export type ResolvedAddress = {
  postal_code: string
  city: string | null
  street?: string | null
  house_number?: string | null
}

export function getInitialStepAnswers(
  questions: Question[],
  stateAnswers: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const q of questions) {
    if (q.type === 'group' && q.groupFields) {
      const groupAnswer: Record<string, unknown> = {}
      for (const subQ of q.groupFields) {
        groupAnswer[subQ.key] = stateAnswers[subQ.key] ?? null
      }
      out[q.key] = groupAnswer
    } else {
      out[q.key] = stateAnswers[q.key] ?? null
    }
  }
  return out
}

export function formatDisplayAddress(addr: ResolvedAddress): string {
  const streetPart = [addr.street, addr.house_number].filter(Boolean).join(' ')
  const placePart = [addr.postal_code, addr.city].filter(Boolean).join(' ')
  if (streetPart && placePart) return `${streetPart}, ${placePart}`
  return placePart || streetPart || ''
}

export function isQuestionDisabled(
  question: Question,
  answer: unknown,
  resolvedAddress: ResolvedAddress | null,
): boolean {
  if (question.type === 'location_GPS') return !resolvedAddress
  if (question.type === 'plz') {
    const plz = String(answer ?? '').trim()
    return plz.length !== 5 || !isValidColognePlz(plz)
  }
  if (
    question.type === 'singleChoice' ||
    question.type === 'singleChoiceWithIcon' ||
    question.type === 'dropdown'
  ) {
    return answer == null || answer === ''
  }
  if (question.type === 'sliderHorizontalRange') {
    return (
      !Array.isArray(answer) ||
      answer.length !== 2 ||
      typeof answer[0] !== 'number' ||
      typeof answer[1] !== 'number'
    )
  }
  if (question.type === 'sliderVertical') {
    return answer === null || answer === undefined || typeof answer !== 'number'
  }
  if (question.type === 'consent') {
    return answer !== true
  }
  if (question.type === 'group' && question.groupFields) {
    for (const subQ of question.groupFields) {
      if (subQ.required && subQ.type === 'plz') {
        const plz = String((answer as Record<string, unknown>)?.[subQ.key] ?? '').trim()
        if (plz.length !== 5 || !isValidColognePlz(plz)) return true
      }
    }
  }
  return false
}

export function isWeiterDisabled(
  questions: Question[],
  stepAnswers: Record<string, unknown>,
  resolvedAddress: ResolvedAddress | null,
): boolean {
  for (const q of questions) {
    const ans =
      q.type === 'group' && q.groupFields ? stepAnswers[q.key] : (stepAnswers[q.key] ?? null)
    if (q.required && isQuestionDisabled(q, ans, resolvedAddress)) return true
  }
  return false
}

export type ValidationResult = { valid: true } | { valid: false; error: string }

export function validateOneQuestion(
  question: Question,
  answer: unknown,
  options: { stateLocation: { postal_code?: string | null } | null },
): ValidationResult {
  if (!question.required) return { valid: true }
  if (question.type === 'group') {
    if (!question.groupFields) return { valid: true }
    for (const subQ of question.groupFields) {
      if (subQ.required) {
        const subAnswer = (answer as Record<string, unknown>)?.[subQ.key]
        if (subQ.type === 'text') {
          if (!subAnswer || String(subAnswer).trim() === '') {
            return { valid: false, error: `Bitte beantworte: ${subQ.title}` }
          }
        } else if (subQ.type === 'plz') {
          const plz = String(subAnswer ?? '').trim()
          if (!plz || plz.length !== 5) {
            return {
              valid: false,
              error: `Bitte gib eine gültige 5-stellige Postleitzahl ein: ${subQ.title}`,
            }
          }
          if (!isValidColognePlz(plz)) {
            return {
              valid: false,
              error: 'Bitte gib eine gültige Postleitzahl von Köln ein.',
            }
          }
        } else if (subAnswer === null || subAnswer === undefined || subAnswer === '') {
          return { valid: false, error: `Bitte beantworte: ${subQ.title}` }
        }
      }
    }
    return { valid: true }
  }
  if (question.type === 'iconSelection') {
    if (!answer || !Array.isArray(answer) || answer.length === 0) {
      return { valid: false, error: 'Bitte wähle mindestens eine Option aus.' }
    }
  } else if (question.type === 'slider') {
    if (answer === null || answer === undefined) {
      return { valid: false, error: 'Bitte wähle einen Wert aus.' }
    }
  } else if (question.type === 'sliderHorizontalRange') {
    if (
      !Array.isArray(answer) ||
      answer.length !== 2 ||
      typeof answer[0] !== 'number' ||
      typeof answer[1] !== 'number'
    ) {
      return { valid: false, error: 'Bitte wähle einen Bereich aus.' }
    }
  } else if (question.type === 'sliderVertical') {
    if (answer === null || answer === undefined || typeof answer !== 'number') {
      return { valid: false, error: 'Bitte wähle einen Wert aus.' }
    }
  } else if (question.type === 'address') {
    const a = answer as { street?: string; postal_code?: string; city?: string } | null
    if (!a || !a.street || (a.street as string).trim() === '') {
      return { valid: false, error: 'Bitte gib eine Straße ein.' }
    }
    const hasPlz =
      a.postal_code &&
      String(a.postal_code).trim().length === 5 &&
      isValidColognePlz(String(a.postal_code).trim())
    const hasCity = a.city && (a.city as string).trim() !== ''
    if (!hasPlz && !hasCity) {
      return { valid: false, error: 'Bitte gib Deine PLZ (Köln) oder Stadt ein.' }
    }
  } else if (question.type === 'location_GPS') {
    if (!options.stateLocation?.postal_code) {
      return {
        valid: false,
        error: 'Bitte ermittel Deinen Standort oder gib Deine Adresse manuell ein.',
      }
    }
    return { valid: true }
  } else if (question.type === 'plz') {
    const plz = String(answer ?? '').trim()
    if (!plz || plz.length !== 5) {
      return { valid: false, error: 'Bitte gib eine gültige 5-stellige Postleitzahl ein.' }
    }
    if (!isValidColognePlz(plz)) {
      return { valid: false, error: 'Bitte gib eine gültige Postleitzahl von Köln ein.' }
    }
  } else if (question.type === 'singleChoice' || question.type === 'singleChoiceWithIcon') {
    if (answer == null || answer === '') {
      return { valid: false, error: 'Bitte wähle eine Option' }
    }
  } else if (question.type === 'multiChoice') {
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      return { valid: false, error: 'Bitte wähle mindestens eine Option aus.' }
    }
  } else if (question.type === 'consent') {
    if (answer !== true) {
      return { valid: false, error: 'Bitte akzeptiere die Datenerhebung, um fortzufahren.' }
    }
  } else {
    if (!answer || answer === '') {
      return { valid: false, error: 'Bitte beantworte diese Frage.' }
    }
  }
  return { valid: true }
}

export function validateAllQuestions(
  questions: Question[],
  stepAnswers: Record<string, unknown>,
  stateLocation: { postal_code?: string | null } | null,
): ValidationResult {
  for (const q of questions) {
    const ans = stepAnswers[q.key] ?? null
    const result = validateOneQuestion(q, ans, { stateLocation })
    if (!result.valid) return result
  }
  return { valid: true }
}
