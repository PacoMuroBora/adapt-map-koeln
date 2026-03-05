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
  /** When true, show instruction screen (instructionTitle + list + CTA Fragebogen starten). */
  useInstructionScreen?: boolean
  /** When set, used instead of router.push for starting the questionnaire (single-route mode). */
  onStart?: () => void
}

export default function QuestionnaireStartView({
  questionnaireName,
  instructionTitle,
  instructionItems = [],
  overline,
  title,
  totalSteps: _totalSteps,
  useInstructionScreen = false,
  onStart: onStartProp,
}: QuestionnaireStartViewProps) {
  const router = useRouter()
  const {
    handlePrevious,
    handleAbortQuestionnaire,
    handleConfirmAbort,
    showAbortDialog,
    setShowAbortDialog,
  } = useQuestionnaireNavigation(questionnaireName, { mode: 'start' })

  const onNext = onStartProp ?? (() => router.push(`/questionnaire/${questionnaireName}/1`))

  const showInstruction =
    useInstructionScreen && (instructionTitle != null || instructionItems.length > 0)

  return (
    <div className="flex w-full h-full flex-col gap-8 px-4 md:px-8 lg:px-16 pt-20 overflow-hidden">
      {/* background grid */}
      <div className="fixed inset-0 z-0 h-screen w-screen background-grid-dark" />

      <div className="flex flex-1 flex-col justify-center w-full h-full z-10">
        {showInstruction ? (
          <div className="flex flex-col gap-10 w-full items-center">
            {instructionTitle && (
              <div className="w-full">
                <h1 className="text-h1 font-headings font-semibold uppercase text-white w-full max-w-[800px]">
                  {instructionTitle}
                </h1>
              </div>
            )}
            {instructionItems.length > 0 && (
              <ul className="flex flex-col gap-8 w-full">
                {instructionItems.map((item, i) => (
                  <li key={i} className="flex gap-4 items-start max-w-[480px]">
                    <span className="font-mono text-[32px] leading-none text-white shrink-0">
                      °{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body text-white leading-[1.35]">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="inline-block md:mt-20">
              <Button
                type="button"
                size="lg"
                shape="round"
                variant="default"
                iconAfter="arrow-down"
                onClick={onNext}
              >
                Fragebogen starten
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg">
            {overline && (
              <p className="text-body-sm font-mono uppercase tracking-wide text-white">
                {overline}
              </p>
            )}
            {title && (
              <h1 className="mt-2 text-deco font-headings font-semibold uppercase text-white">
                {title}
              </h1>
            )}
          </div>
        )}
      </div>

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={onNext}
        nextLabel={showInstruction ? 'Fragebogen starten' : 'Starten'}
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
