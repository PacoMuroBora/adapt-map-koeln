'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { SubmissionState } from '@/providers/Submission/types'
import type { Question } from './questions'

const STEPS_TO_SKIP_WHEN_GPS = ['plz', 'address'] as const

export type StepNavigationConfig = {
  mode: 'step'
  stepNumber: number
  totalSteps: number
  questionTypes: Question['type'][]
  /** Flat list of question types per step (index = stepNumber - 1). When set, used to skip plz/address in one go after GPS. */
  allStepQuestionTypes?: Question['type'][][]
  /** Single question per step (questions array has one element). */
  question?: Question
  answer?: unknown
  questions?: Question[]
  stepAnswers?: Record<string, unknown>
  state: {
    location?: { postal_code?: string | null } | null
    answers?: Record<string, unknown>
  }
  updateAnswer: (key: string, value: unknown) => void
  updateCurrentStep: (step: SubmissionState['currentStep']) => void
  validateAnswer: () => boolean | Promise<boolean>
  /** When set, called with the next path instead of navigating immediately (e.g. to run exit animation). */
  onBeforeNextNavigate?: (path: string) => void
  /** When set, called with the prev path instead of navigating immediately (e.g. to run exit animation). */
  onBeforePrevNavigate?: (path: string) => void
}

export type StartNavigationConfig = {
  mode: 'start'
}

export function useQuestionnaireNavigation(
  questionnaireName: string,
  config: StepNavigationConfig | StartNavigationConfig,
) {
  const router = useRouter()
  const [showAbortDialog, setShowAbortDialog] = useState(false)

  const handleAbortQuestionnaire = () => {
    setShowAbortDialog(true)
  }

  const handleConfirmAbort = () => {
    setShowAbortDialog(false)
    router.push('/')
  }

  const handlePrevious = () => {
    if (config.mode === 'start') {
      router.push(`/questionnaire/${questionnaireName}`)
      return
    }
    const {
      stepNumber,
      questionTypes,
      allStepQuestionTypes,
      question,
      answer,
      questions,
      stepAnswers,
      updateAnswer,
      state,
    } = config
    if (questions?.length && stepAnswers) {
      for (const q of questions) {
        if (q.type === 'group' && q.groupFields) {
          const groupVal = stepAnswers[q.key] as Record<string, unknown> | undefined
          if (groupVal) {
            q.groupFields.forEach((subQ) => {
              updateAnswer(subQ.key, groupVal[subQ.key])
            })
          }
        } else {
          updateAnswer(q.key, stepAnswers[q.key])
        }
      }
    } else if (question && answer !== undefined) {
      if (question.type === 'group' && question.groupFields) {
        question.groupFields.forEach((subQ) => {
          updateAnswer(subQ.key, (answer as Record<string, unknown>)[subQ.key])
        })
      } else {
        updateAnswer(question.key, answer)
      }
    }
    let prevStep = stepNumber - 1
    if (config.state.location?.postal_code && allStepQuestionTypes && allStepQuestionTypes.length >= stepNumber) {
      while (
        prevStep >= 1 &&
        (allStepQuestionTypes[prevStep - 1] ?? []).every((t) =>
          STEPS_TO_SKIP_WHEN_GPS.includes(t as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]),
        )
      ) {
        prevStep--
      }
    }
    const path =
      prevStep >= 1
        ? `/questionnaire/${questionnaireName}/${prevStep}`
        : `/questionnaire/${questionnaireName}`
    if (config.onBeforePrevNavigate) {
      config.onBeforePrevNavigate(path)
    } else {
      router.push(path)
    }
  }

  const handleNext = async () => {
    if (config.mode === 'start') {
      router.push(`/questionnaire/${questionnaireName}/1`)
      return
    }
    const {
      stepNumber,
      totalSteps,
      questionTypes,
      allStepQuestionTypes,
      question,
      answer,
      questions,
      stepAnswers,
      updateAnswer,
      updateCurrentStep,
      validateAnswer,
    } = config
    const valid = await Promise.resolve(validateAnswer())
    if (!valid) return
    if (questions?.length && stepAnswers) {
      for (const q of questions) {
        if (q.type === 'group' && q.groupFields) {
          const groupVal = stepAnswers[q.key] as Record<string, unknown> | undefined
          if (groupVal) {
            q.groupFields.forEach((subQ) => {
              updateAnswer(subQ.key, groupVal[subQ.key])
            })
          }
        } else {
          updateAnswer(q.key, stepAnswers[q.key])
        }
      }
    } else if (question && answer !== undefined) {
      if (question.type === 'group' && question.groupFields) {
        question.groupFields.forEach((subQ) => {
          updateAnswer(subQ.key, (answer as Record<string, unknown>)[subQ.key])
        })
      } else {
        updateAnswer(question.key, answer)
      }
    }
    updateCurrentStep('questionnaire')
    let nextStep = stepNumber + 1
    const isGpsStep =
      (question && question.type === 'location_GPS') ||
      (questionTypes.length > 0 && questionTypes.includes('location_GPS'))
    if (isGpsStep && config.state.location?.postal_code) {
      if (allStepQuestionTypes && allStepQuestionTypes.length >= totalSteps) {
        while (
          nextStep <= totalSteps &&
          (allStepQuestionTypes[nextStep - 1] ?? []).every((t) =>
            STEPS_TO_SKIP_WHEN_GPS.includes(t as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]),
          )
        ) {
          nextStep++
        }
      } else if (questionTypes.length > 0) {
        while (
          nextStep <= totalSteps &&
          STEPS_TO_SKIP_WHEN_GPS.includes(
            questionTypes[nextStep - 1] as (typeof STEPS_TO_SKIP_WHEN_GPS)[number],
          )
        ) {
          nextStep++
        }
      }
    }
    const path =
      nextStep <= totalSteps ? `/questionnaire/${questionnaireName}/${nextStep}` : '/feedback'
    if (config.onBeforeNextNavigate) {
      config.onBeforeNextNavigate(path)
    } else {
      router.push(path)
    }
  }

  return {
    handleNext,
    handlePrevious,
    handleAbortQuestionnaire,
    handleConfirmAbort,
    showAbortDialog,
    setShowAbortDialog,
  }
}
