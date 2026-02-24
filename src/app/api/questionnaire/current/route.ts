import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export const revalidate = 600 // Cache for 10 minutes

export async function GET() {
  try {
    const payload = await getPayloadClient()

    const { docs } = await payload.find({
      collection: 'questionnaires',
      where: {
        isCurrent: { equals: true },
        status: { equals: 'active' },
      },
      limit: 1,
      depth: 2,
    })
    const questionnaire = docs[0]

    if (!questionnaire || questionnaire.status !== 'active') {
      return NextResponse.json({ error: 'No active questionnaire found' }, { status: 404 })
    }

    const sections = questionnaire.sections
    const steps = questionnaire.steps
    const legacyQuestions = questionnaire.questions
    const rawQuestions =
      Array.isArray(sections) && sections.length > 0
        ? (sections as { steps?: { questions?: unknown[] }[] }[]).flatMap((sec) =>
            (sec.steps ?? []).flatMap((st) => st.questions ?? []),
          )
        : Array.isArray(steps) && steps.length > 0
          ? (steps as { questions?: unknown[] }[]).flatMap((s) => s.questions ?? [])
          : Array.isArray(legacyQuestions)
            ? legacyQuestions
            : []

    if (rawQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Questionnaire must have at least one question' },
        { status: 400 },
      )
    }

    const questions = [...rawQuestions].sort((a, b) => {
      if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
        const aOrder =
          (a as { editorFields?: { displayOrder?: number } }).editorFields?.displayOrder ?? 999
        const bOrder =
          (b as { editorFields?: { displayOrder?: number } }).editorFields?.displayOrder ?? 999
        return aOrder - bOrder
      }
      return 0
    })

    return NextResponse.json({
      id: (questionnaire as { id?: string }).id,
      name: questionnaire.name,
      questionCount: questions.length,
      questions: questions
        .map((q) => {
          if (typeof q !== 'object' || q === null || typeof (q as { key?: unknown }).key === 'undefined') return null
          const qu = q as {
            id?: string
            key?: string
            title_de?: string
            description_de?: string
            type?: string
            options?: unknown
            sliderConfig?: unknown
            required?: boolean
            category?: unknown
            editorFields?: unknown
          }
          return {
            id: qu.id,
            key: qu.key,
            title_de: qu.title_de,
            description_de: qu.description_de,
            type: qu.type,
            options: qu.options,
            sliderConfig: qu.sliderConfig,
            required: qu.required,
            category: qu.category,
            editorFields: qu.editorFields,
          }
        })
        .filter((q) => q !== null),
    })
  } catch (error: unknown) {
    console.error('Questionnaire fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch questionnaire' }, { status: 500 })
  }
}
