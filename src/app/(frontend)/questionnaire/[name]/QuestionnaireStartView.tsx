'use client'

import { useRouter } from 'next/navigation'
import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
import { useQuestionnaireNavigation } from '../useQuestionnaireNavigation'
import { Button } from '@/components/ui/button'

type QuestionnaireStartViewProps = {
  questionnaireName: string
  instructionTitle?: string
  instructionItems?: string[]
  overline?: string
  title?: string
  totalSteps: number
  /** When true, show instruction screen (instructionTitle + list + CTA FRAGEBOGEN STARTEN). */
  useInstructionScreen?: boolean
}

export default function QuestionnaireStartView({
  questionnaireName,
  instructionTitle,
  instructionItems = [],
  overline,
  title,
  totalSteps: _totalSteps,
  useInstructionScreen = false,
}: QuestionnaireStartViewProps) {
  const router = useRouter()
  const {
    handlePrevious,
    handleAbortQuestionnaire,
    handleConfirmAbort,
    showAbortDialog,
    setShowAbortDialog,
  } = useQuestionnaireNavigation(questionnaireName, { mode: 'start' })

  const onNext = () => {
    router.push(`/questionnaire/${questionnaireName}/1`)
  }

  const showInstruction = useInstructionScreen && (instructionTitle != null || instructionItems.length > 0)

  return (
    <div className="flex w-full h-full flex-col gap-8 px-4 pt-4 pb-28 overflow-hidden">
      {/* background grid */}
      <div className="fixed -top-8 -left-8 background-grid w-[110%] h-[110%] z-0" />

      <div className="flex flex-1 flex-col justify-center items-center w-full z-10">
        {showInstruction ? (
          <div className="flex flex-col items-center gap-10 w-full max-w-[327px]">
            {instructionTitle && (
              <h1 className="text-deco font-headings font-semibold uppercase text-white text-center w-full">
                {instructionTitle}
              </h1>
            )}
            {instructionItems.length > 0 && (
              <ul className="flex flex-col gap-8 w-full">
                {instructionItems.map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="font-mono text-[32px] leading-none text-white shrink-0">
                      °{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body text-white leading-[1.35]">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              size="lg"
              shape="round"
              variant="default"
              iconAfter="arrow-down"
              onClick={onNext}
              className="w-full"
            >
              FRAGEBOGEN STARTEN
            </Button>
          </div>
        ) : (
          <>
            {overline && (
              <p className="text-body-sm font-mono uppercase tracking-wide text-white">{overline}</p>
            )}
            {title && (
              <h1 className="mt-2 text-deco font-headings font-semibold uppercase text-white">
                {title}
              </h1>
            )}
          </>
        )}
      </div>

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={onNext}
        nextLabel={showInstruction ? 'FRAGEBOGEN STARTEN' : 'Starten'}
        nextButtonVariant={showInstruction ? 'default' : 'white'}
        hideNextButton={showInstruction}
        onAbort={handleAbortQuestionnaire}
        showAbortDialog={showAbortDialog}
        setShowAbortDialog={setShowAbortDialog}
        onConfirmAbort={handleConfirmAbort}
        isFirstPage
      />
    </div>
  )
}
