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
  question: Question
  answer: unknown
  state: { location?: { postal_code?: string | null } | null }
  updateAnswer: (key: string, value: unknown) => void
  updateCurrentStep: (step: SubmissionState['currentStep']) => void
  validateAnswer: () => boolean
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
    const { stepNumber, questionTypes, question, answer, updateAnswer, state } = config
    if (question.type === 'group' && question.groupFields) {
      question.groupFields.forEach((subQ) => {
        updateAnswer(subQ.key, (answer as Record<string, unknown>)[subQ.key])
      })
    } else {
      updateAnswer(question.key, answer)
    }
    let prevStep = stepNumber - 1
    if (state.location?.postal_code) {
      while (
        prevStep >= 1 &&
        STEPS_TO_SKIP_WHEN_GPS.includes(
          questionTypes[prevStep - 1] as (typeof STEPS_TO_SKIP_WHEN_GPS)[number],
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

  const handleNext = () => {
    if (config.mode === 'start') {
      router.push(`/questionnaire/${questionnaireName}/1`)
      return
    }
    const {
      stepNumber,
      totalSteps,
      questionTypes,
      question,
      answer,
      updateAnswer,
      updateCurrentStep,
      validateAnswer,
    } = config
    if (!validateAnswer()) return
    if (question.type === 'group' && question.groupFields) {
      question.groupFields.forEach((subQ) => {
        updateAnswer(subQ.key, (answer as Record<string, unknown>)[subQ.key])
      })
    } else {
      updateAnswer(question.key, answer)
    }
    updateCurrentStep('questionnaire')
    let nextStep = stepNumber + 1
    if (question.type === 'location_GPS' && config.state.location?.postal_code) {
      while (
        nextStep <= totalSteps &&
        STEPS_TO_SKIP_WHEN_GPS.includes(
          questionTypes[nextStep - 1] as (typeof STEPS_TO_SKIP_WHEN_GPS)[number],
        )
      ) {
        nextStep++
      }
    }
    const path =
      nextStep <= totalSteps
        ? `/questionnaire/${questionnaireName}/${nextStep}`
        : '/feedback'
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
