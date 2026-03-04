'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { SubmissionState } from '@/providers/Submission/types'
import type { Question } from './questions'

const STEPS_TO_SKIP_WHEN_GPS = ['plz', 'address'] as const

export type StartNavigationConfig = {
  mode: 'start'
}

/** Single-route mode: step 0 = start, 1..totalSteps = pages. No router for step changes. */
export type LocalNavigationConfig = {
  mode: 'local'
  currentStep: number
  setCurrentIndex: (step: number) => void
  totalSteps: number
  questionTypes: Question['type'][]
  allStepQuestionTypes?: Question['type'][][]
  questions?: Question[]
  stepAnswers?: Record<string, unknown>
  state: {
    location?: { postal_code?: string | null } | null
    answers?: Record<string, unknown>
  }
  updateAnswer: (key: string, value: unknown) => void
  updateCurrentStep: (step: SubmissionState['currentStep']) => void
  validateAnswer: () => boolean | Promise<boolean>
  goToFeedback?: () => void
}

export function useQuestionnaireNavigation(
  questionnaireName: string,
  config: StartNavigationConfig | LocalNavigationConfig,
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
      currentStep,
      setCurrentIndex,
      totalSteps,
      questionTypes,
      allStepQuestionTypes,
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
    }
    let prevStep = currentStep - 1
    if (state.location?.postal_code && allStepQuestionTypes && allStepQuestionTypes.length >= currentStep) {
      while (
        prevStep >= 1 &&
        (allStepQuestionTypes[prevStep - 1] ?? []).every((t) =>
          STEPS_TO_SKIP_WHEN_GPS.includes(t as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]),
        )
      ) {
        prevStep--
      }
    }
    setCurrentIndex(prevStep >= 1 ? prevStep : 0)
  }

  const handleNext = async () => {
    if (config.mode === 'start') {
      router.push(`/questionnaire/${questionnaireName}/1`)
      return
    }
    const {
      currentStep,
      setCurrentIndex,
      totalSteps,
      questionTypes,
      allStepQuestionTypes,
      questions,
      stepAnswers,
      updateAnswer,
      updateCurrentStep,
      validateAnswer,
      state,
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
    }
    updateCurrentStep('questionnaire')
    let nextStep = currentStep + 1
    const isGpsStep =
      (questions?.[0]?.type === 'location_GPS') ||
      (questionTypes.length > 0 && questionTypes.includes('location_GPS'))
    if (isGpsStep && state.location?.postal_code) {
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
    if (nextStep <= totalSteps) {
      setCurrentIndex(nextStep)
    } else {
      config.goToFeedback ? config.goToFeedback() : router.push('/feedback')
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
