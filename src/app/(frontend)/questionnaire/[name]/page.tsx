import { getCachedQuestionnaire } from '@/utilities/getQuestionnaire'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { notFound, redirect } from 'next/navigation'
import { hasSections } from '../getQuestionnairePageByIndex'
import { buildQuestionnaireRuntime } from '../buildQuestionnaireRuntime'
import QuestionnaireRuntimeClient from '../QuestionnaireRuntimeClient'
import type { UiCopy } from '@/payload-types'

export const revalidate = 600

type Args = {
  params: Promise<{ name: string }>
}

export default async function QuestionnaireStartPage({ params: paramsPromise }: Args) {
  const { name: nameParam } = await paramsPromise

  const questionnaire = await getCachedQuestionnaire(nameParam, 2)()
  if (!questionnaire) {
    notFound()
  }

  const questionnaireName = questionnaire.name ?? nameParam
  if (nameParam === 'current' && questionnaireName !== 'current') {
    redirect(`/questionnaire/${questionnaireName}`)
  }

  const uiCopy = (await getCachedGlobal('ui-copy', 0)()) as UiCopy
  const nextButtonText = uiCopy?.questionnaire?.nextButton ?? 'Weiter'
  const previousButtonText = uiCopy?.questionnaire?.previousButton ?? 'Zurück'

  const runtime = buildQuestionnaireRuntime(
    questionnaire,
    questionnaireName,
    nextButtonText,
    previousButtonText,
  )
  if (!runtime) {
    notFound()
  }

  return <QuestionnaireRuntimeClient runtime={runtime} />
}
