'use client'

import type React from 'react'
import { QuestionnaireProgressProvider, useQuestionnaireProgress } from '../QuestionnaireProgressContext'
import SectionProgressBar from '@/components/questionnaire/SectionProgressBar'

function ProgressBarSlot() {
  const ctx = useQuestionnaireProgress()
  const progress = ctx?.progress ?? null
  const hasProgress = Boolean(progress?.sections?.length)
  if (!hasProgress) return null
  return (
    <div className="fixed right-4 top-20 z-10 flex h-[70lvh] max-h-[calc(100vh-6rem)] min-h-0 flex-col py-2 md:right-6">
      <SectionProgressBar
        sections={progress.sections}
        currentSectionIndex={progress.currentSectionIndex}
        currentStepInSection={progress.currentStepInSection}
        progressColor={progress.progressColor}
        onStepClick={progress.onStepClick}
        className="h-full"
      />
    </div>
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
    </QuestionnaireProgressProvider>
  )
}
