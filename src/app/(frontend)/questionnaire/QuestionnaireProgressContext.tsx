'use client'

import React, { createContext, useContext, useState } from 'react'

export type QuestionnaireProgressState = {
  sections: { stepsCount: number; progressColor?: string }[]
  currentSectionIndex: number
  currentStepInSection: number
  variant?: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
  onStepClick?: (step: number) => void
}

type ContextValue = {
  progress: QuestionnaireProgressState | null
  setProgress: (state: QuestionnaireProgressState | null) => void
}

const QuestionnaireProgressContext = createContext<ContextValue | null>(null)

export function QuestionnaireProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<QuestionnaireProgressState | null>(null)
  return (
    <QuestionnaireProgressContext.Provider value={{ progress, setProgress }}>
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
