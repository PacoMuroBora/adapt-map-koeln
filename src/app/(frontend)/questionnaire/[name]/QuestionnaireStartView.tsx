'use client'

import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
import { useQuestionnaireNavigation } from '../useQuestionnaireNavigation'
import { Shape01 } from '@/components/CustomShapes/shape01'
import PaginationSteps from '@/components/questionnaire/PaginationSteps'

type QuestionnaireStartViewProps = {
  questionnaireName: string
  overline: string
  title: string
  totalSteps: number
}

export default function QuestionnaireStartView({
  questionnaireName,
  overline,
  title,
  totalSteps,
}: QuestionnaireStartViewProps) {
  const {
    handleNext,
    handlePrevious,
    handleAbortQuestionnaire,
    handleConfirmAbort,
    showAbortDialog,
    setShowAbortDialog,
  } = useQuestionnaireNavigation(questionnaireName, { mode: 'start' })

  return (
    <div className="flex w-full h-full flex-col gap-8 px-4 pt-4 pb-6 overflow-hidden">
      {/* background grid */}
      <div className="fixed -top-8 -left-8 background-grid w-[110%] h-[110%] z-0" />

      {/* shape */}
      <div className="absolute top-16 -right-4 z-10">
        <Shape01 />
      </div>

      <div className="flex flex-1 flex-col justify-end w-full z-10">
        <p className="text-body-sm font-mono uppercase tracking-wide text-white">{overline}</p>
        <h1 className="mt-2 text-deco font-headings font-semibold uppercase text-white">{title}</h1>
      </div>

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        nextLabel="Starten"
        onAbort={handleAbortQuestionnaire}
        showAbortDialog={showAbortDialog}
        setShowAbortDialog={setShowAbortDialog}
        onConfirmAbort={handleConfirmAbort}
      />

      <PaginationSteps currentStep={1} totalSteps={totalSteps} />
    </div>
  )
}
