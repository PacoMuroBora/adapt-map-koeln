'use client'

import type React from 'react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  QuestionnaireProgressProvider,
  useQuestionnaireProgress,
} from '../QuestionnaireProgressContext'
import SectionProgressBar from '@/components/questionnaire/SectionProgressBar'
import { Alert } from '@/components/ui/alert'

function ProgressBarSlot() {
  const ctx = useQuestionnaireProgress()
  const progress = ctx?.progress ?? null
  const maxStepReachedInSection = ctx?.maxStepReachedInSection ?? {}
  if (!progress?.sections?.length) return null
  const currentSectionIndex = progress.currentSectionIndex
  const maxInSection = maxStepReachedInSection[currentSectionIndex] ?? 0
  const filledStepNumbersInSection =
    maxInSection > 0
      ? Array.from({ length: maxInSection }, (_, i) => i + 1)
      : undefined
  return (
    <div className="fixed right-4 top-20 z-10 flex h-[70lvh] max-h-[calc(100vh-6rem)] min-h-0 flex-col py-2 md:right-6">
      <SectionProgressBar
        sections={progress.sections}
        currentSectionIndex={progress.currentSectionIndex}
        currentStepInSection={progress.currentStepInSection}
        filledStepNumbersInSection={filledStepNumbersInSection}
        variant={progress.variant}
        onStepClick={progress.onStepClick}
        className="h-full"
      />
    </div>
  )
}

function QuestionnaireErrorAlert() {
  const ctx = useQuestionnaireProgress()
  const error = ctx?.questionnaireError ?? null
  const setQuestionnaireError = ctx?.setQuestionnaireError

  useEffect(() => {
    if (!error || !setQuestionnaireError) return
    const timer = setTimeout(() => setQuestionnaireError(null), 2500)
    return () => clearTimeout(timer)
  }, [error, setQuestionnaireError])

  if (!error) return null
  return (
    <AnimatePresence>
      <motion.div
        key="questionnaire-alert"
        initial={{ x: '-50%', y: -100, opacity: 0 }}
        animate={{ x: '-50%', y: 0, opacity: 1 }}
        exit={{ x: '-50%', y: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-1/2 z-50 w-full max-w-[560px] p-2"
      >
        <Alert variant="error" className="text-sm">
          {error}
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Provider lives at [name] so it does NOT remount when [step] changes.
 * That keeps progress state across step navigation so the bar can animate.
 */
export default function NameLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuestionnaireProgressProvider>
      {children}
      <ProgressBarSlot />
      <QuestionnaireErrorAlert />
    </QuestionnaireProgressProvider>
  )
}
