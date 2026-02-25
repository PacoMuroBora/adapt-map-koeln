'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

export type QuestionnaireProgressState = {
  sections: { stepsCount: number; progressColor?: string }[]
  currentSectionIndex: number
  currentStepInSection: number
  variant?: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
  onStepClick?: (step: number) => void
}

/** Per-section max step number (1-based) the user has visited. Used to keep steps filled and clickable when going back. */
export type MaxStepReachedInSection = Record<number, number>

type ContextValue = {
  progress: QuestionnaireProgressState | null
  setProgress: (state: QuestionnaireProgressState | null) => void
  maxStepReachedInSection: MaxStepReachedInSection
  questionnaireError: string | null
  setQuestionnaireError: (message: string | null) => void
}

const QuestionnaireProgressContext = createContext<ContextValue | null>(null)

export function QuestionnaireProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<QuestionnaireProgressState | null>(null)
  const [maxStepReachedInSection, setMaxStepReachedInSection] =
    useState<MaxStepReachedInSection>(() => ({}))
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null)

  const setProgress = useCallback((state: QuestionnaireProgressState | null) => {
    setProgressState(state)
    if (state) {
      setMaxStepReachedInSection((prev) => ({
        ...prev,
        [state.currentSectionIndex]: Math.max(
          prev[state.currentSectionIndex] ?? 0,
          state.currentStepInSection,
        ),
      }))
    }
  }, [])

  return (
    <QuestionnaireProgressContext.Provider
      value={{
        progress,
        setProgress,
        maxStepReachedInSection,
        questionnaireError,
        setQuestionnaireError,
      }}
    >
      {children}
    </QuestionnaireProgressContext.Provider>
  )
}

export function useQuestionnaireProgress() {
  const ctx = useContext(QuestionnaireProgressContext)
  return ctx
}

/** Call from SectionCoverView / QuestionClient to sync progress bar. Keeps bar mounted in layout so it can animate. */
export function useSetQuestionnaireProgress(state: QuestionnaireProgressState | null) {
  const ctx = useQuestionnaireProgress()
  const setProgress = ctx?.setProgress
  React.useEffect(() => {
    if (setProgress == null) return
    const t = setTimeout(() => setProgress(state), 0)
    return () => clearTimeout(t)
  }, [setProgress, state])
}
