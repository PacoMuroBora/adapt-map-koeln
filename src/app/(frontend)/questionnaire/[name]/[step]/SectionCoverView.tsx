'use client'

import { useRouter } from 'next/navigation'
import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
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
}

export default function SectionCoverView({
  questionnaireName,
  sectionIndex: _sectionIndex,
  sectionTitle,
  sectionSubtitle,
  colorCardProgress,
  colorCardBg: _colorCardBg,
  stepNumber,
  totalSteps: _totalSteps,
  nextButtonText,
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

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-4 pt-4 pb-28">
      {/* Background grid */}
      <div className="fixed -top-8 -left-8 z-0 h-[110%] w-[110%] background-grid" />

      {/* Cover figure: color from CMS */}
      <div className="absolute left-6 top-10 z-10 w-[366px] max-w-[calc(100%-48px)]">
        <Shape01 color={figureColor} />
      </div>

      {/* No progress bar on section cover – it shows only on step pages */}

      {/* Section text at bottom: CMS subtitle as overline, then title (spaced up for nav) */}
      <div className="relative z-10 flex flex-1 flex-col justify-end">
        <div className="flex flex-col gap-3 pb-10">
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
