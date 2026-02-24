'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
import { useSetQuestionnaireProgress } from '../../QuestionnaireProgressContext'
import { useQuestionnaireNavigation } from '../../useQuestionnaireNavigation'
import { Shape01 } from '@/components/CustomShapes/shape01'

export type SectionCoverViewProps = {
  questionnaireName: string
  sectionIndex: number
  sectionTitle: string
  /** From CMS; may contain "Teil 2" etc. Shown as overline. */
  sectionSubtitle?: string
  /** Section color for the cover figure and progress bar (e.g. purple, orange). */
  colorCardProgress?: string
  colorCardBg?: string
  stepNumber: number
  totalSteps: number
  nextButtonText: string
  /** Progress bar: sections list and current section index. When set, progress bar is shown. */
  sectionsProgress?: { stepsCount: number; progressColor?: string }[]
  currentSectionIndex?: number
}

export default function SectionCoverView({
  questionnaireName,
  sectionIndex,
  sectionTitle,
  sectionSubtitle,
  colorCardProgress,
  colorCardBg: _colorCardBg,
  stepNumber,
  totalSteps: _totalSteps,
  nextButtonText,
  sectionsProgress,
  currentSectionIndex = 0,
}: SectionCoverViewProps) {
  const router = useRouter()
  const {
    handleAbortQuestionnaire,
    showAbortDialog,
    setShowAbortDialog,
    handleConfirmAbort,
  } = useQuestionnaireNavigation(questionnaireName, { mode: 'start' })

  const handleNext = () => {
    router.push(`/questionnaire/${questionnaireName}/${stepNumber + 1}`)
  }

  const handlePrevious = () => {
    if (stepNumber <= 1) {
      router.push(`/questionnaire/${questionnaireName}`)
    } else {
      router.push(`/questionnaire/${questionnaireName}/${stepNumber - 1}`)
    }
  }

  const figureColor = colorCardProgress ?? '#BCB4FF'

  const progressState = useMemo(
    () =>
      Array.isArray(sectionsProgress) && sectionsProgress.length > 0
        ? {
            sections: sectionsProgress,
            currentSectionIndex,
            currentStepInSection: 0 as const,
            progressColor: colorCardProgress,
          }
        : null,
    [sectionsProgress, currentSectionIndex, colorCardProgress],
  )
  useSetQuestionnaireProgress(progressState)

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] h-full w-full flex-col overflow-hidden px-4 pt-4 pb-28">
      {/* Background grid */}
      <div className="fixed inset-0 z-0 h-screen w-screen background-grid" />

      {/* Cover figure: color from CMS — relatively positioned, almost centered with shift, scales with viewport */}
      <div className="relative left-1/2 top-8 z-10 w-[min(85vw,65vmin)] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-[8%]">
        <Shape01 color={figureColor} className="h-auto w-full" />
      </div>

      {/* Progress bar rendered by [step] layout so it stays mounted and can animate */}

      {/* Section text at bottom: CMS subtitle as overline, then title (spaced up for nav) — same container as welcome/steps */}
      <div className="relative z-10 flex flex-1 flex-col justify-end">
        <div className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg flex flex-col gap-3 pb-10">
          {sectionSubtitle && (
            <p className="font-mono text-body-sm uppercase tracking-wide text-white">
              {sectionSubtitle}
            </p>
          )}
          <h1 className="text-h2 font-headings font-semibold uppercase leading-[1.05] tracking-tight text-white">
            {sectionTitle}
          </h1>
        </div>
      </div>

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        nextLabel={nextButtonText}
        onAbort={handleAbortQuestionnaire}
        showAbortDialog={showAbortDialog}
        setShowAbortDialog={setShowAbortDialog}
        onConfirmAbort={handleConfirmAbort}
      />
    </div>
  )
}
