import { getPayloadClient } from '@/lib/payload'
import { notFound, redirect } from 'next/navigation'
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
      nameParam === 'current' ? { isCurrent: { equals: true } } : { name: { equals: nameParam } },
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

  const questionCount = Array.isArray(questionnaire.questions) ? questionnaire.questions.length : 0
  const totalSteps = questionCount + 1

  return (
    <QuestionnaireStartView
      questionnaireName={questionnaireName}
      overline={questionnaire.overline}
      title={questionnaire.title}
      totalSteps={totalSteps}
    />
  )
}
