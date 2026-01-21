'use client'

import React, { createContext, use, useCallback, useEffect, useState } from 'react'

import canUseDOM from '@/utilities/canUseDOM'

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

const STORAGE_KEY = 'adaptmap-submission-state'

export const SubmissionProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SubmissionState>(initialSubmissionState)

  // Load state from localStorage on mount
  useEffect(() => {
    if (!canUseDOM) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only restore if it's recent (within 24 hours)
        const storedTime = parsed._timestamp
        if (storedTime && Date.now() - storedTime < 24 * 60 * 60 * 1000) {
          // Remove the timestamp before setting state
          const { _timestamp, ...restoredState } = parsed
          // Merge with initial state to ensure defaults (like questionnaireVersion) are set
          setState({ ...initialSubmissionState, ...restoredState })
        } else {
          // Clear old state
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to load submission state from localStorage:', error)
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!canUseDOM) return

    try {
      const stateToStore = {
        ...state,
        _timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore))
    } catch (error) {
      console.error('Failed to save submission state to localStorage:', error)
    }
  }, [state])

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
    if (canUseDOM) {
      localStorage.removeItem(STORAGE_KEY)
    }
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
