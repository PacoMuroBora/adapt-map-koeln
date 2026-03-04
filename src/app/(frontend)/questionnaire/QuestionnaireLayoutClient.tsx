'use client'

import type React from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

export type CloseContextValue = {
  onAbort: (() => void) | null
  registerClose: (onAbort: () => void) => () => void
}

const CloseContext = createContext<CloseContextValue | null>(null)

export function useQuestionnaireClose() {
  return useContext(CloseContext)
}

/** Provider for questionnaire close (used in root layout so Header can call onAbort). */
export function QuestionnaireCloseProvider({ children }: { children: React.ReactNode }) {
  const [onAbort, setOnAbort] = useState<(() => void) | null>(null)
  const registerClose = useCallback((handler: () => void) => {
    setOnAbort(() => handler)
    return () => setOnAbort(null)
  }, [])
  return (
    <CloseContext.Provider value={{ onAbort, registerClose }}>
      {children}
    </CloseContext.Provider>
  )
}

export default function QuestionnaireLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-black" aria-hidden />
      <div className="relative flex h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex-col bg-black md:h-auto md:min-h-[calc(100vh-3.5rem)] md:justify-center">
        {children}
      </div>
    </>
  )
}
