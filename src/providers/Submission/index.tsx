'use client'

import React, { createContext, use, useCallback, useState } from 'react'

import type {
  ConsentData,
  Location,
  PersonalFields,
  SubmissionContextType,
  SubmissionState,
} from './types'
import { initialSubmissionState } from './types'

const initialContext: SubmissionContextType = {
  state: initialSubmissionState,
  updateConsent: () => null,
  updateLocation: () => null,
  updatePersonalFields: () => null,
  updateAnswer: () => null,
  updateAnswers: () => null,
  updateUserText: () => null,
  updateCurrentStep: () => null,
  updateQuestionnaireVersion: () => null,
  updateResults: () => null,
  updateAIResults: () => null,
  reset: () => null,
}

const SubmissionContext = createContext(initialContext)

export const SubmissionProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SubmissionState>(initialSubmissionState)

  const updateConsent = useCallback((consent: ConsentData) => {
    setState((prev) => ({ ...prev, consent }))
  }, [])

  const updateLocation = useCallback((location: Location) => {
    setState((prev) => ({ ...prev, location }))
  }, [])

  const updatePersonalFields = useCallback((fields: Partial<PersonalFields>) => {
    setState((prev) => ({
      ...prev,
      personalFields: { ...prev.personalFields, ...fields },
    }))
  }, [])

  const updateAnswer = useCallback((questionKey: string, answer: any) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionKey]: answer },
    }))
  }, [])

  const updateAnswers = useCallback((answers: Record<string, any>) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, ...answers },
    }))
  }, [])

  const updateUserText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, userText: text }))
  }, [])

  const updateCurrentStep = useCallback((step: SubmissionState['currentStep']) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  const updateQuestionnaireVersion = useCallback((version: string) => {
    setState((prev) => ({ ...prev, questionnaireVersion: version }))
  }, [])

  const updateResults = useCallback(
    (data: { submissionId: string; problemIndex: number; subScores?: Record<string, number> }) => {
      setState((prev) => ({
        ...prev,
        submissionId: data.submissionId,
        problemIndex: data.problemIndex,
        subScores: data.subScores || null,
      }))
    },
    [],
  )

  const updateAIResults = useCallback(
    (data: { aiSummary: string; aiRecommendations: any[]; aiGeneratedAt: string }) => {
      setState((prev) => ({
        ...prev,
        aiSummary: data.aiSummary,
        aiRecommendations: data.aiRecommendations,
        aiGeneratedAt: data.aiGeneratedAt,
      }))
    },
    [],
  )

  const reset = useCallback(() => {
    setState(initialSubmissionState)
  }, [])

  const contextValue: SubmissionContextType = {
    state,
    updateConsent,
    updateLocation,
    updatePersonalFields,
    updateAnswer,
    updateAnswers,
    updateUserText,
    updateCurrentStep,
    updateQuestionnaireVersion,
    updateResults,
    updateAIResults,
    reset,
  }

  return <SubmissionContext value={contextValue}>{children}</SubmissionContext>
}

export const useSubmission = (): SubmissionContextType => use(SubmissionContext)
