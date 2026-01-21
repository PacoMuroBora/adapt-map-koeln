import { NextResponse } from 'next/server'
import { APIError } from 'payload'
import { getPayloadClient } from '@/lib/payload'

type SubmissionPayload = {
  location: {
    lat: number
    lng: number
    postal_code: string
    city?: string
    street?: string
  }
  questionnaireVersion?: string
  answers: Record<string, any>
  personalFields?: {
    age?: number | null
    gender?: string | null
    householdSize?: number | null
  }
  freeText?: string
}

/**
 * Calculate a simple problem index based on heat frequency and intensity
 * This is a simplified version - can be enhanced later
 */
function calculateSimpleProblemIndex(
  heatFrequency?: string,
  heatIntensity?: number,
): { problemIndex: number; subScores: Record<string, number> } {
  let problemIndex = 0
  const subScores: Record<string, number> = {}

  // Map heat frequency to score (0-100)
  const frequencyScores: Record<string, number> = {
    '1-3': 20,
    '4-10': 40,
    '11-20': 60,
    '21-40': 80,
    '>40': 100,
  }

  if (heatFrequency) {
    const frequencyScore = frequencyScores[heatFrequency] || 0
    subScores['frequency'] = frequencyScore
    problemIndex += frequencyScore * 0.5 // 50% weight
  }

  // Map heat intensity to score (0-100)
  // Slider is 0-9, map to 0-100
  if (heatIntensity !== null && heatIntensity !== undefined) {
    const intensityScore = (heatIntensity / 9) * 100
    subScores['intensity'] = intensityScore
    problemIndex += intensityScore * 0.5 // 50% weight
  }

  return {
    problemIndex: Math.max(0, Math.min(100, problemIndex)),
    subScores,
  }
}

export async function POST(req: Request) {
  try {
    const body: SubmissionPayload = await req.json()

    // Validate required fields
    if (!body.location || !body.location.lat || !body.location.lng || !body.location.postal_code) {
      throw new APIError('Missing required location fields', 400)
    }

    if (!body.answers || Object.keys(body.answers).length === 0) {
      throw new APIError('Missing answers', 400)
    }

    const payload = await getPayloadClient()

    // Extract answers from the new structure
    const heatFrequency = body.answers.heatFrequency
    const heatIntensity = body.answers.heatIntensity
    const housingType = body.answers.housingType
    const greenNeighborhood = body.answers.greenNeighborhood
    const cityArea = body.answers.cityArea
    const knowsTerm = body.answers.knowsTerm
    const climateDescription = body.answers.description
    const desiredChanges = body.answers.desiredChanges || []
    const locationAnswer = body.answers.location || {}

    // Calculate problem index
    const { problemIndex, subScores } = calculateSimpleProblemIndex(heatFrequency, heatIntensity)

    // Map desiredChanges array to the format expected by the collection
    const desiredChangesArray = Array.isArray(desiredChanges)
      ? desiredChanges.map((icon) => ({ icon }))
      : []

    // Create submission
    // ⚠️ CRITICAL: Use overrideAccess: false since anyone can create submissions
    const submission = await payload.create({
      collection: 'submissions',
      data: {
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || undefined,
        },
        location: {
          lat: body.location.lat,
          lng: body.location.lng,
          postal_code: body.location.postal_code,
          city: body.location.city || undefined,
          street: body.location.street || locationAnswer.street || undefined,
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
        questionnaireVersion: body.questionnaireVersion || 'v1.0',
        heatFrequency: heatFrequency || undefined,
        heatIntensity: heatIntensity !== null && heatIntensity !== undefined ? heatIntensity : undefined,
        livingSituation: {
          housingType: housingType || undefined,
          greenNeighborhood: greenNeighborhood || undefined,
          cityArea: cityArea || undefined,
        },
        climateAdaptationKnowledge: {
          knowsTerm: knowsTerm === 'true' || knowsTerm === true,
          description: climateDescription || undefined,
        },
        desiredChanges: desiredChangesArray,
        problem_index: problemIndex,
        sub_scores: subScores,
        user_text: body.freeText || undefined,
      },
      overrideAccess: false, // Respect access control (anyone can create)
    })

    // Generate baseline results
    let severity: 'niedrig' | 'mittel' | 'hoch' = 'niedrig'
    if (problemIndex >= 70) {
      severity = 'hoch'
    } else if (problemIndex >= 40) {
      severity = 'mittel'
    }

    const baselineResults = {
      summary: `Ihr Hitze-Problem-Index: ${Math.round(problemIndex)}/100 (${severity})`,
      severity,
      insights: Object.entries(subScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => {
          const categoryLabel = category === 'frequency' ? 'Häufigkeit' : 'Intensität'
          if (score >= 70) {
            return `${categoryLabel}: Kritisch`
          } else if (score >= 40) {
            return `${categoryLabel}: Problematisch`
          } else {
            return `${categoryLabel}: Unauffällig`
          }
        }),
    }

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
