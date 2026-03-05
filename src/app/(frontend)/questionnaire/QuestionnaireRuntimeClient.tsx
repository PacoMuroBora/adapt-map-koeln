'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback, useMemo } from 'react'
import type { QuestionnaireRuntime, RuntimePage } from './buildQuestionnaireRuntime'
import QuestionnaireStartView from './[name]/QuestionnaireStartView'
import SectionCoverView from './[name]/[step]/SectionCoverView'
import QuestionClient from './[name]/[step]/QuestionClient'

type Props = {
  runtime: QuestionnaireRuntime
}

export default function QuestionnaireRuntimeClient({ runtime }: Props) {
  const router = useRouter()
  const [pageIndex, setPageIndex] = useState(0)

  const goToFeedback = useCallback(() => {
    router.push('/feedback')
  }, [router])

  const localNavigation = useMemo(
    () => ({
      setCurrentIndex: setPageIndex,
      currentStep: pageIndex,
      totalSteps: runtime.totalSteps,
      allStepQuestionTypes: runtime.allStepQuestionTypes,
      goToFeedback,
    }),
    [pageIndex, runtime.totalSteps, runtime.allStepQuestionTypes, goToFeedback],
  )

  if (pageIndex === 0) {
    return (
      <QuestionnaireStartView
        questionnaireName={runtime.questionnaireName}
        instructionTitle={runtime.startView.instructionTitle}
        instructionItems={runtime.startView.instructionItems}
        overline={runtime.startView.overline}
        title={runtime.startView.title}
        totalSteps={runtime.startView.totalSteps}
        useInstructionScreen={runtime.startView.useInstructionScreen}
        onStart={() => setPageIndex(1)}
      />
    )
  }

  const stepNumber = pageIndex
  const page: RuntimePage | undefined = runtime.pages[stepNumber - 1]
  if (!page) {
    goToFeedback()
    return null
  }

  if (page.type === 'section-cover') {
    return (
      <SectionCoverView
        questionnaireName={runtime.questionnaireName}
        sectionIndex={page.sectionIndex}
        sectionTitle={page.sectionTitle}
        sectionSubtitle={page.sectionSubtitle}
        colorSection={page.colorSection}
        stepNumber={stepNumber}
        totalSteps={runtime.totalSteps}
        nextButtonText={runtime.nextButtonText}
        sectionsProgress={page.sectionsProgress}
        currentSectionIndex={page.currentSectionIndex}
        sectionFigure={page.sectionFigure}
        onNext={() => setPageIndex(stepNumber + 1)}
        onPrev={stepNumber <= 1 ? () => setPageIndex(0) : () => setPageIndex(stepNumber - 1)}
      />
    )
  }

  if (page.type === 'conditional-step') {
    return (
      <QuestionClient
        questionnaireName={runtime.questionnaireName}
        questions={[]}
        stepNumber={stepNumber}
        totalSteps={runtime.totalSteps}
        questionTypes={[]}
        allStepQuestionTypes={runtime.allStepQuestionTypes}
        nextButtonText={runtime.nextButtonText}
        previousButtonText={runtime.previousButtonText}
        colorSection={page.colorSection}
        sectionStepsTotal={page.sectionStepsTotal}
        sectionStepNumber={page.sectionStepNumber}
        sectionsProgress={page.sectionsProgress}
        currentSectionIndex={page.currentSectionIndex}
        conditionalStepConfig={{
          parentQuestionKey: page.parentQuestionKey,
          conditions: page.conditions,
        }}
        localNavigation={localNavigation}
      />
    )
  }

  if (page.type === 'step') {
    return (
      <QuestionClient
        questionnaireName={runtime.questionnaireName}
        questions={page.questions}
        stepNumber={stepNumber}
        totalSteps={runtime.totalSteps}
        questionTypes={page.questionTypes}
        allStepQuestionTypes={runtime.allStepQuestionTypes}
        nextButtonText={runtime.nextButtonText}
        previousButtonText={runtime.previousButtonText}
        colorSection={page.colorSection}
        sectionStepsTotal={page.sectionStepsTotal}
        sectionStepNumber={page.sectionStepNumber}
        sectionsProgress={page.sectionsProgress}
        currentSectionIndex={page.currentSectionIndex}
        localNavigation={localNavigation}
      />
    )
  }

  return null
}
