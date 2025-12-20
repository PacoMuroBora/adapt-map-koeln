import { NextResponse } from 'next/server'
import { APIError } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Question, Questionnaire } from '@/payload-types'

type SubmissionPayload = {
  location: {
    lat: number
    lng: number
    postal_code: string
    city?: string
  }
  questionnaireVersion: string
  answers: Record<string, any>
  consentVersion?: string
  personalFields?: {
    age?: number | null
    gender?: string | null
    householdSize?: number | null
  }
  freeText?: string
}

type ScoringResult = {
  problemIndex: number
  subScores: Record<string, number>
}

/**
 * Calculate problem index based on admin-defined scoring weights
 */
function calculateProblemIndex(answers: Record<string, any>, questions: Question[]): ScoringResult {
  let totalScore = 0
  let maxPossibleScore = 0
  const subScores: Record<string, { score: number; max: number }> = {}

  questions.forEach((question) => {
    const answer = answers[question.key]
    if (answer === null || answer === undefined || answer === '') {
      return // Skip unanswered questions
    }

    // Get admin scoring configuration
    const adminScoring = question.adminScoring as any
    const weight = adminScoring?.weight ?? 1
    const category = question.category

    let score = 0
    let maxScoreForQuestion = 100 // Default max score per question

    switch (question.type) {
      case 'singleChoice':
      case 'dropdown': {
        // Use admin-defined option scores if available
        if (adminScoring?.optionScores && Array.isArray(adminScoring.optionScores)) {
          const optionScore = adminScoring.optionScores.find(
            (opt: any) => opt.optionValue === answer,
          )
          score = optionScore?.score ?? 0
        } else {
          // Fallback: use score from options array if available
          const option = question.options?.find((opt: any) => opt.value === answer)
          score = option?.score ?? 0
        }
        maxScoreForQuestion = 100
        break
      }

      case 'multiChoice': {
        // For multi-choice, sum scores of selected options
        if (Array.isArray(answer)) {
          answer.forEach((selectedValue: string) => {
            if (adminScoring?.optionScores && Array.isArray(adminScoring.optionScores)) {
              const optionScore = adminScoring.optionScores.find(
                (opt: any) => opt.optionValue === selectedValue,
              )
              score += optionScore?.score ?? 0
            } else {
              // Fallback: use score from options array
              const option = question.options?.find((opt: any) => opt.value === selectedValue)
              score += option?.score ?? 0
            }
          })
        }
        // Max score is sum of all positive option scores, or 100 if not defined
        maxScoreForQuestion = 100
        break
      }

      case 'slider': {
        const sliderConfig = question.sliderConfig as any
        const min = sliderConfig?.min ?? 0
        const max = sliderConfig?.max ?? 100
        const sliderValue = typeof answer === 'number' ? answer : parseFloat(answer)

        if (isNaN(sliderValue)) {
          return // Skip invalid slider values
        }

        const sliderMapping = adminScoring?.sliderMapping
        const normalization = sliderMapping?.normalization ?? 'linear'
        const minScore = sliderMapping?.minScore ?? 0
        const maxScore = sliderMapping?.maxScore ?? 100

        if (normalization === 'linear') {
          // Linear interpolation: map slider value to score range
          if (max > min) {
            const normalized = (sliderValue - min) / (max - min)
            score = minScore + normalized * (maxScore - minScore)
          } else {
            score = minScore
          }
        } else if (normalization === 'logarithmic') {
          // Logarithmic mapping (useful for exponential scales)
          if (max > min && sliderValue > min) {
            const normalized = Math.log(sliderValue - min + 1) / Math.log(max - min + 1)
            score = minScore + normalized * (maxScore - minScore)
          } else {
            score = minScore
          }
        } else {
          // Custom or fallback: simple linear
          if (max > min) {
            const normalized = (sliderValue - min) / (max - min)
            score = minScore + normalized * (maxScore - minScore)
          } else {
            score = minScore
          }
        }

        maxScoreForQuestion = Math.max(maxScore, 100)
        break
      }

      default:
        return // Unknown question type, skip
    }

    // Apply weight to score
    const weightedScore = score * weight
    const weightedMax = maxScoreForQuestion * weight

    totalScore += weightedScore
    maxPossibleScore += weightedMax

    // Track sub-scores by category
    if (category) {
      if (!subScores[category]) {
        subScores[category] = { score: 0, max: 0 }
      }
      subScores[category].score += weightedScore
      subScores[category].max += weightedMax
    }
  })

  // Normalize to 0-100 scale
  const problemIndex = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  // Normalize sub-scores to 0-100 scale
  const normalizedSubScores: Record<string, number> = {}
  Object.keys(subScores).forEach((category) => {
    const { score, max } = subScores[category]
    normalizedSubScores[category] = max > 0 ? (score / max) * 100 : 0
  })

  return {
    problemIndex: Math.max(0, Math.min(100, problemIndex)), // Clamp to 0-100
    subScores: normalizedSubScores,
  }
}

/**
 * Generate baseline results text based on problem index
 */
function generateBaselineResults(
  problemIndex: number,
  subScores: Record<string, number>,
): {
  summary: string
  severity: 'niedrig' | 'mittel' | 'hoch'
  insights: string[]
} {
  let severity: 'niedrig' | 'mittel' | 'hoch' = 'niedrig'
  if (problemIndex >= 70) {
    severity = 'hoch'
  } else if (problemIndex >= 40) {
    severity = 'mittel'
  }

  const summary = `Ihr Hitze-Problem-Index: ${Math.round(problemIndex)}/100 (${severity})`

  // Generate category-specific insights
  const insights = Object.entries(subScores)
    .sort(([, a], [, b]) => b - a) // Sort by score descending
    .slice(0, 3) // Top 3 categories
    .map(([category, score]) => {
      const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)
      if (score >= 70) {
        return `${categoryLabel}: Kritisch`
      } else if (score >= 40) {
        return `${categoryLabel}: Problematisch`
      } else {
        return `${categoryLabel}: Unauffällig`
      }
    })

  return {
    summary,
    severity,
    insights,
  }
}

export async function POST(req: Request) {
  try {
    const body: SubmissionPayload = await req.json()

    // Validate required fields
    if (!body.location || !body.location.lat || !body.location.lng || !body.location.postal_code) {
      throw new APIError('Missing required location fields', 400)
    }

    if (!body.questionnaireVersion) {
      throw new APIError('Missing questionnaire version', 400)
    }

    if (!body.answers || Object.keys(body.answers).length === 0) {
      throw new APIError('Missing answers', 400)
    }

    const payload = await getPayload({ config: configPromise })

    // Get the questionnaire
    const questionnaires = await payload.find({
      collection: 'questionnaires',
      where: {
        or: [
          { id: { equals: body.questionnaireVersion } },
          { version: { equals: body.questionnaireVersion } },
        ],
      },
      limit: 1,
      depth: 2,
      overrideAccess: false, // Respect access control
    })

    if (!questionnaires.docs.length) {
      throw new APIError('Questionnaire not found', 404)
    }

    const questionnaire = questionnaires.docs[0] as Questionnaire

    // Get questions with full depth to access adminScoring
    const questionIds = Array.isArray(questionnaire.questions)
      ? questionnaire.questions.filter((q): q is Question => typeof q !== 'string').map((q) => q.id)
      : []

    if (questionIds.length === 0) {
      throw new APIError('Questionnaire has no questions', 400)
    }

    // For scoring, we need adminScoring data which has field-level access control
    // We use overrideAccess: true here because:
    // 1. This is a system operation (scoring calculation)
    // 2. We're only reading scoring configuration, not user data
    // 3. The submission data itself is still protected by access control
    const questionsWithScoring = await payload.find({
      collection: 'questions',
      where: {
        id: { in: questionIds },
      },
      limit: 100,
      depth: 0,
      overrideAccess: true, // System operation - need scoring config
    })

    // Calculate problem index
    const { problemIndex, subScores } = calculateProblemIndex(
      body.answers,
      questionsWithScoring.docs as Question[],
    )

    // Create submission
    // ⚠️ CRITICAL: Use overrideAccess: false since anyone can create submissions
    // The access control on the collection allows 'anyone' to create
    const submission = await payload.create({
      collection: 'submissions',
      data: {
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || undefined,
          consent_version: body.consentVersion || '1.0',
        },
        location: {
          lat: body.location.lat,
          lng: body.location.lng,
          postal_code: body.location.postal_code,
          city: body.location.city || undefined,
        },
        personalFields: body.personalFields
          ? {
              age: body.personalFields.age ?? undefined,
              gender:
                (body.personalFields.gender as
                  | 'male'
                  | 'female'
                  | 'diverse'
                  | 'prefer_not_to_say'
                  | null
                  | undefined) ?? undefined,
              householdSize: body.personalFields.householdSize ?? undefined,
            }
          : {},
        questionnaireVersion: body.questionnaireVersion,
        answers: body.answers,
        problem_index: problemIndex,
        sub_scores: subScores,
        user_text: body.freeText || undefined,
      },
      overrideAccess: false, // Respect access control (anyone can create)
    })

    // Generate baseline results
    const baselineResults = generateBaselineResults(problemIndex, subScores)

    return NextResponse.json({
      submissionId: submission.id,
      problemIndex,
      subScores,
      baselineResults,
    })
  } catch (error) {
    console.error('Submission error:', error)

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 })
  }
}
