import { NextResponse } from 'next/server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const revalidate = 600 // Cache for 10 minutes

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get current questionnaire
    const questionnaires = await payload.find({
      collection: 'questionnaires',
      where: {
        isCurrent: { equals: true },
        status: { equals: 'active' },
      },
      limit: 1,
      depth: 2,
      overrideAccess: false, // Respect access control
    })

    if (!questionnaires.docs.length) {
      return NextResponse.json({ error: 'No active questionnaire found' }, { status: 404 })
    }

    const questionnaire = questionnaires.docs[0]

    // Ensure we have at least one question
    if (!questionnaire.questions || questionnaire.questions.length === 0) {
      return NextResponse.json(
        { error: 'Questionnaire must have at least one question' },
        { status: 400 },
      )
    }

    // Sort questions by displayOrder if available
    const questions = Array.isArray(questionnaire.questions) ? [...questionnaire.questions] : []

    // Sort by displayOrder if available, otherwise keep original order
    questions.sort((a, b) => {
      if (typeof a === 'string' || typeof b === 'string') return 0
      const aOrder =
        a.editorFields?.displayOrder !== undefined && a.editorFields.displayOrder !== null
          ? a.editorFields.displayOrder
          : 999
      const bOrder =
        b.editorFields?.displayOrder !== undefined && b.editorFields.displayOrder !== null
          ? b.editorFields.displayOrder
          : 999
      return aOrder - bOrder
    })

    return NextResponse.json({
      id: questionnaire.id,
      version: questionnaire.version,
      questionCount: questions.length,
      questions: questions
        .map((q) => {
          if (typeof q === 'string') return null
          return {
            id: q.id,
            key: q.key,
            title_de: q.title_de,
            description_de: q.description_de,
            type: q.type,
            options: q.options,
            sliderConfig: q.sliderConfig,
            required: q.required,
            category: q.category,
            editorFields: q.editorFields,
          }
        })
        .filter((q) => q !== null),
    })
  } catch (error: any) {
    console.error('Questionnaire fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch questionnaire' }, { status: 500 })
  }
}
