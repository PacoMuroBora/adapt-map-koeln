import { getPayloadClient } from '@/lib/payload'
import { notFound, redirect } from 'next/navigation'
import { getQuestionnaireTotalPages, hasSections } from '../getQuestionnairePageByIndex'
import QuestionnaireStartView from './QuestionnaireStartView'

export const revalidate = 600

type Args = {
  params: Promise<{ name: string }>
}

export default async function QuestionnaireStartPage({ params: paramsPromise }: Args) {
  const { name: nameParam } = await paramsPromise

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'questionnaires',
    where:
      nameParam === 'current'
        ? { isCurrent: { equals: true } }
        : { name: { equals: nameParam } },
    limit: 1,
    depth: 0,
  })
  const questionnaire = docs[0]
  if (!questionnaire) {
    notFound()
  }

  const questionnaireName = questionnaire.name ?? nameParam
  if (nameParam === 'current' && questionnaireName !== 'current') {
    redirect(`/questionnaire/${questionnaireName}`)
  }

  const useSections = hasSections(questionnaire)
  const totalSteps = useSections
    ? getQuestionnaireTotalPages(questionnaire)
    : Array.isArray(questionnaire.steps) && questionnaire.steps.length > 0
      ? questionnaire.steps.length
      : Array.isArray(questionnaire.questions)
        ? questionnaire.questions.length
        : 0

  const instructionItems =
    Array.isArray(questionnaire.instructionItems) &&
    questionnaire.instructionItems.length > 0
      ? questionnaire.instructionItems.map((i) => (i && typeof i === 'object' ? i.item : '')).filter(Boolean)
      : []

  return (
    <QuestionnaireStartView
      questionnaireName={questionnaireName}
      instructionTitle={questionnaire.instructionTitle ?? undefined}
      instructionItems={instructionItems}
      overline={questionnaire.overline ?? undefined}
      title={questionnaire.title ?? undefined}
      totalSteps={totalSteps}
      useInstructionScreen={useSections && Boolean(questionnaire.instructionTitle != null)}
    />
  )
}
