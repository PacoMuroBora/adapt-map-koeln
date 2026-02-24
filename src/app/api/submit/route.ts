import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
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

const HEAT_FREQUENCY_VALUES = ['1-3', '4-10', '11-20', '21-40', '>40'] as const
function normalizeHeatFrequency(val: unknown): (typeof HEAT_FREQUENCY_VALUES)[number] | undefined {
  if (val == null || val === '') return undefined
  const s = String(val).trim()
  const match = HEAT_FREQUENCY_VALUES.find((v) => v === s || v.replace(/\s/g, '') === s.replace(/\s/g, ''))
  return match
}

function normalizeHeatIntensity(val: unknown): number | undefined {
  if (val == null || val === '') return undefined
  const n = Number(val)
  if (Number.isNaN(n)) return undefined
  return Math.max(0, Math.min(9, Math.round(n)))
}

const HOUSING_TYPES = ['apartment', 'house'] as const
const HOUSING_TYPE_ALIASES: Record<string, (typeof HOUSING_TYPES)[number]> = {
  wohnung: 'apartment',
  apartment: 'apartment',
  haus: 'house',
  house: 'house',
}
function normalizeHousingType(val: unknown): (typeof HOUSING_TYPES)[number] | undefined {
  if (val == null || val === '') return undefined
  const s = String(val).trim().toLowerCase()
  return HOUSING_TYPES.includes(s as any) ? (s as (typeof HOUSING_TYPES)[number]) : HOUSING_TYPE_ALIASES[s]
}

const GREEN_NEIGHBORHOOD_VALUES = ['yes', 'no', 'unsure'] as const
const GREEN_ALIASES: Record<string, (typeof GREEN_NEIGHBORHOOD_VALUES)[number]> = {
  ja: 'yes',
  yes: 'yes',
  nein: 'no',
  no: 'no',
  'weiß nicht': 'unsure',
  unsicher: 'unsure',
  unsure: 'unsure',
}
function normalizeGreenNeighborhood(val: unknown): (typeof GREEN_NEIGHBORHOOD_VALUES)[number] | undefined {
  if (val == null || val === '') return undefined
  const s = String(val).trim().toLowerCase()
  return GREEN_NEIGHBORHOOD_VALUES.includes(s as any) ? (s as any) : GREEN_ALIASES[s]
}

const CITY_AREA_VALUES = ['inner', 'outer'] as const
const CITY_AREA_ALIASES: Record<string, (typeof CITY_AREA_VALUES)[number]> = {
  innenstadt: 'inner',
  inner: 'inner',
  'äußerer bereich': 'outer',
  outer: 'outer',
  ausser: 'outer',
}
function normalizeCityArea(val: unknown): (typeof CITY_AREA_VALUES)[number] | undefined {
  if (val == null || val === '') return undefined
  const s = String(val).trim().toLowerCase()
  return CITY_AREA_VALUES.includes(s as any) ? (s as any) : CITY_AREA_ALIASES[s]
}

/** Get first defined value from answers by trying multiple keys (flat or nested) */
function getFromAnswers(answers: Record<string, any>, ...keyPaths: string[]): unknown {
  for (const path of keyPaths) {
    const parts = path.split('.')
    let v: any = answers
    for (const p of parts) {
      v = v?.[p]
      if (v === undefined) break
    }
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

/** Normalize location to the exact shape expected by Submissions collection (numbers and strings only) */
function normalizeLocation(bodyLocation: any, locationAnswer: any): {
  lat: number
  lng: number
  postal_code: string
  city?: string
  street?: string
} {
  const lat = Number(bodyLocation?.lat)
  const lng = Number(bodyLocation?.lng)
  const postal_code = bodyLocation?.postal_code != null ? String(bodyLocation.postal_code).trim() : ''
  const city =
    bodyLocation?.city != null && String(bodyLocation.city).trim() !== ''
      ? String(bodyLocation.city).trim()
      : undefined
  const streetRaw = bodyLocation?.street ?? locationAnswer?.street
  const street =
    streetRaw != null && typeof streetRaw === 'string' && streetRaw.trim() !== ''
      ? streetRaw.trim()
      : typeof streetRaw === 'string'
        ? streetRaw.trim() || undefined
        : undefined
  return {
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    postal_code: postal_code,
    ...(city && { city }),
    ...(street && { street }),
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

    // Extract answers — support flat keys and nested (e.g. livingSituation.housingType), then normalize for schema
    const answers = body.answers
    const livingSituationRaw =
      answers.livingSituation && typeof answers.livingSituation === 'object'
        ? answers.livingSituation
        : {}

    const heatFrequencyRaw = getFromAnswers(
      answers,
      'heatFrequency',
      'heat_frequency',
      'heatfrequency',
    )
    const heatIntensityRaw = getFromAnswers(
      answers,
      'heatIntensity',
      'heat_intensity',
      'heatintensity',
    )
    const housingTypeRaw =
      livingSituationRaw.housingType ??
      getFromAnswers(answers, 'housingType', 'housing_type')
    const greenNeighborhoodRaw =
      livingSituationRaw.greenNeighborhood ??
      livingSituationRaw.green_neighborhood ??
      getFromAnswers(answers, 'greenNeighborhood', 'green_neighborhood')
    const cityAreaRaw =
      livingSituationRaw.cityArea ??
      livingSituationRaw.city_area ??
      getFromAnswers(answers, 'cityArea', 'city_area')

    const heatFrequency = normalizeHeatFrequency(heatFrequencyRaw)
    const heatIntensity = normalizeHeatIntensity(heatIntensityRaw)
    const housingType = normalizeHousingType(housingTypeRaw)
    const greenNeighborhood = normalizeGreenNeighborhood(greenNeighborhoodRaw)
    const cityArea = normalizeCityArea(cityAreaRaw)

    const knowsTerm = answers.knowsTerm
    const climateDescription = answers.description
    const desiredChanges = answers.desiredChanges || []
    const locationAnswer = answers.location || {}

    const personalFieldsFromBody = body.personalFields
    const personalFieldsMerged = {
      age: personalFieldsFromBody?.age ?? answers.age ?? undefined,
      gender:
        personalFieldsFromBody?.gender ??
        (answers.gender as 'male' | 'female' | 'diverse' | 'prefer_not_to_say' | undefined) ??
        undefined,
      householdSize: personalFieldsFromBody?.householdSize ?? answers.householdSize ?? undefined,
    }

    const knownKeys = new Set([
      'heatFrequency',
      'heat_frequency',
      'heatintensity',
      'heatIntensity',
      'heat_intensity',
      'livingSituation',
      'housingType',
      'housing_type',
      'greenNeighborhood',
      'green_neighborhood',
      'cityArea',
      'city_area',
      'knowsTerm',
      'description',
      'desiredChanges',
      'location',
      'age',
      'gender',
      'householdSize',
    ])
    const dynamicAnswers: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(answers)) {
      if (!knownKeys.has(key) && value !== undefined && value !== null) {
        dynamicAnswers[key] = value
      }
    }

    // Calculate problem index (use defaults for missing so calculation doesn't break)
    const freqForCalc = heatFrequency ?? '1-3'
    const intForCalc = heatIntensity ?? 0
    const { problemIndex, subScores } = calculateSimpleProblemIndex(freqForCalc, intForCalc)

    // Map desiredChanges array to the format expected by the collection
    const desiredChangesArray = Array.isArray(desiredChanges)
      ? desiredChanges.map((icon) => ({ icon }))
      : []

    const locationForDb = normalizeLocation(body.location, locationAnswer)
    if (
      !locationForDb.postal_code ||
      !Number.isFinite(locationForDb.lat) ||
      !Number.isFinite(locationForDb.lng)
    ) {
      throw new APIError('Missing or invalid location (lat, lng, postal_code required)', 400)
    }

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
          lat: locationForDb.lat,
          lng: locationForDb.lng,
          postal_code: locationForDb.postal_code,
          city: locationForDb.city,
          street: locationForDb.street,
        },
        personalFields: {
          age: personalFieldsMerged.age ?? undefined,
          gender:
            (personalFieldsMerged.gender as
              | 'male'
              | 'female'
              | 'diverse'
              | 'prefer_not_to_say'
              | null
              | undefined) ?? undefined,
          householdSize: personalFieldsMerged.householdSize ?? undefined,
        },
        dynamicAnswers: Object.keys(dynamicAnswers).length > 0 ? dynamicAnswers : undefined,
        questionnaireVersion: body.questionnaireVersion || 'v1.0',
        heatFrequency: heatFrequency ?? '1-3',
        heatIntensity: heatIntensity !== null && heatIntensity !== undefined ? heatIntensity : 0,
        livingSituation: {
          housingType: housingType ?? 'apartment',
          greenNeighborhood: greenNeighborhood ?? 'unsure',
          cityArea: cityArea ?? 'outer',
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

    // Invalidate heatmap cache so new submission appears immediately
    revalidateTag('heatmap-grid')
    revalidateTag('heatmap')

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
