'use client'

import { X } from 'lucide-react'
import type React from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

type CloseContextValue = {
  onAbort: (() => void) | null
  registerClose: (onAbort: () => void) => () => void
}

const CloseContext = createContext<CloseContextValue | null>(null)

export function useQuestionnaireClose() {
  return useContext(CloseContext)
}

function CloseButton() {
  const ctx = useQuestionnaireClose()
  if (ctx?.onAbort == null) return null
  return (
    <button
      type="button"
      onClick={ctx.onAbort}
      className="fixed top-4 right-4 z-50"
      aria-label="Fragebogen schließen"
    >
      <X className="size-5 text-white" />
    </button>
  )
}

export default function QuestionnaireLayoutClient({ children }: { children: React.ReactNode }) {
  const [onAbort, setOnAbort] = useState<(() => void) | null>(null)
  const registerClose = useCallback((handler: () => void) => {
    setOnAbort(() => handler)
    return () => setOnAbort(null)
  }, [])

  return (
    <CloseContext.Provider value={{ onAbort, registerClose }}>
      <div className="fixed inset-0 z-0 bg-black" aria-hidden />
      <div className="relative z-10 flex h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex-col bg-black md:h-auto md:min-h-[calc(100vh-3.5rem)] md:justify-center">
        {children}
      </div>
      <CloseButton />
    </CloseContext.Provider>
  )
}
