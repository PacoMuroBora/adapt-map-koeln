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

function calculateSimpleProblemIndex(
  heatFrequency?: string,
  heatIntensity?: number,
): { problemIndex: number; subScores: Record<string, number> } {
  let problemIndex = 0
  const subScores: Record<string, number> = {}

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
    problemIndex += frequencyScore * 0.5
  }

  if (heatIntensity !== null && heatIntensity !== undefined) {
    const intensityScore = (heatIntensity / 10) * 100
    subScores['intensity'] = intensityScore
    problemIndex += intensityScore * 0.5
  }

  return {
    problemIndex: Math.max(0, Math.min(100, problemIndex)),
    subScores,
  }
}

// --- Value normalizers (type coercion only, no key guessing) ---

const HEAT_FREQUENCY_VALUES = ['1-3', '4-10', '11-20', '21-40', '>40'] as const
function normalizeHeatFrequency(val: unknown): (typeof HEAT_FREQUENCY_VALUES)[number] | undefined {
  if (val == null || val === '') return undefined
  const s = String(val).trim()
  return HEAT_FREQUENCY_VALUES.find(
    (v) => v === s || v.replace(/\s/g, '') === s.replace(/\s/g, ''),
  )
}

function normalizeHeatIntensity(val: unknown): number | undefined {
  if (val == null || val === '') return undefined
  const n = Number(val)
  if (Number.isNaN(n)) return undefined
  return Math.max(0, Math.min(10, Math.round(n)))
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
  return HOUSING_TYPES.includes(s as any)
    ? (s as (typeof HOUSING_TYPES)[number])
    : HOUSING_TYPE_ALIASES[s]
}

const VALID_GREEN_NEIGHBORHOOD = new Set([
  'open_streets', 'greenery', 'main_road', 'park',
  'no_greenery', 'river', 'closed_surfaces',
])
function normalizeGreenNeighborhood(val: unknown): string[] | undefined {
  const arr = Array.isArray(val) ? val : val != null ? [val] : []
  const result = arr
    .map((v: unknown) => String(v).trim().toLowerCase())
    .filter((v) => VALID_GREEN_NEIGHBORHOOD.has(v))
  return result.length > 0 ? result : undefined
}

const CITY_AREA_VALUES = ['inner', 'outer'] as const
const CITY_AREA_ALIASES: Record<string, (typeof CITY_AREA_VALUES)[number]> = {
  innenstadt: 'inner',
  inner: 'inner',
  citycenter: 'inner',
  'äußerer bereich': 'outer',
  outer: 'outer',
  outskirts: 'outer',
  ausser: 'outer',
}
function normalizeCityArea(val: unknown): (typeof CITY_AREA_VALUES)[number] | undefined {
  if (val == null || val === '') return undefined
  const s = String(val).trim().toLowerCase()
  return CITY_AREA_VALUES.includes(s as any) ? (s as any) : CITY_AREA_ALIASES[s]
}

type SubmissionBinding = {
  mode?: string | null
  fieldPath?: string | null
  customKey?: string | null
}

const VALID_DESIRED_CHANGES = new Set([
  'schatten', 'cooling', 'dachbegruenung', 'strassenbegruenung', 'wasserstellen',
])
const DESIRED_CHANGES_ALIASES: Record<string, string> = {
  shadow: 'schatten',
  verschattung: 'schatten',
  shading: 'schatten',
  'dachbegrünung': 'dachbegruenung',
  roof_greening: 'dachbegruenung',
  'straßenbegrünung': 'strassenbegruenung',
  'strassenbegrünung': 'strassenbegruenung',
  facade_greening: 'strassenbegruenung',
  water: 'wasserstellen',
  water_fountain: 'wasserstellen',
  wasserspender: 'wasserstellen',
  'kühlung': 'cooling',
}

/**
 * Sets a value at a dot-separated path in the target object, creating intermediate objects as needed.
 */
function setNestedValue(target: Record<string, any>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current = target
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  current[parts[parts.length - 1]!] = value
}

/**
 * Applies per-field normalization so raw answer values match the Submissions schema.
 */
function normalizeForField(fieldPath: string, value: unknown): unknown {
  switch (fieldPath) {
    case 'heatFrequency':
      return normalizeHeatFrequency(value)
    case 'heatIntensity':
      return normalizeHeatIntensity(value)
    case 'livingSituation.housingType':
      return normalizeHousingType(value)
    case 'livingSituation.greenNeighborhood':
      return normalizeGreenNeighborhood(value)
    case 'livingSituation.cityArea':
      return normalizeCityArea(value)
    case 'consent':
    case 'climateAdaptationKnowledge.knowsTerm':
      return value === 'true' || value === true
    case 'personalFields.age':
    case 'personalFields.householdSize':
    case 'location.lat':
    case 'location.lng': {
      if (value == null || value === '') return undefined
      const n = Number(value)
      return Number.isNaN(n) ? undefined : n
    }
    case 'desiredChanges': {
      const arr = Array.isArray(value) ? value : []
      return arr
        .map((raw: unknown) => {
          const v = String(raw).trim().toLowerCase()
          const resolved = DESIRED_CHANGES_ALIASES[v] ?? v
          return VALID_DESIRED_CHANGES.has(resolved) ? { icon: resolved } : null
        })
        .filter(Boolean)
    }
    default:
      return value
  }
}

/**
 * Handles the composite `location` binding: an address-type answer sets multiple location sub-fields.
 */
function applyLocationBinding(
  target: Record<string, any>,
  value: unknown,
  bodyLocation: SubmissionPayload['location'],
): void {
  if (!value || typeof value !== 'object') return
  const addr = value as Record<string, unknown>
  const street = [String(addr.street ?? '').trim(), String(addr.housenumber ?? '').trim()]
    .filter(Boolean)
    .join(' ')

  if (!target.location) target.location = {}
  if (street) target.location.street = street
  if (addr.postal_code) target.location.postal_code = String(addr.postal_code).trim()
  if (addr.city) target.location.city = String(addr.city).trim()
}

/**
 * Fallback mapping from known legacy question keys to submission field paths.
 * Used when a question has no submissionBinding configured yet.
 */
const LEGACY_KEY_MAP: Record<string, string> = {
  heat_frequency: 'heatFrequency',
  heatFrequency: 'heatFrequency',
  heat_intensity: 'heatIntensity',
  heatIntensity: 'heatIntensity',
  livingsituation: 'livingSituation.housingType',
  housingType: 'livingSituation.housingType',
  housing_type: 'livingSituation.housingType',
  livingsituation_location: 'livingSituation.cityArea',
  cityArea: 'livingSituation.cityArea',
  city_area: 'livingSituation.cityArea',
  greenNeighborhood: 'livingSituation.greenNeighborhood',
  green_neighborhood: 'livingSituation.greenNeighborhood',
  heat_klimawandel: 'climateAdaptationKnowledge.knowsTerm',
  knowsTerm: 'climateAdaptationKnowledge.knowsTerm',
  heat_klimawandel_freitext: 'climateAdaptationKnowledge.description',
  description: 'climateAdaptationKnowledge.description',
  heat_changes: 'desiredChanges',
  desiredChanges: 'desiredChanges',
  heat_ideen: 'user_text',
  neighborhood: 'livingSituation.greenNeighborhood',
  age: 'personalFields.age',
  gender: 'personalFields.gender',
  householdSize: 'personalFields.householdSize',
  consent: 'consent',
  location_manual: 'location',
}

/** Keys that are navigation/meta state and should be silently skipped */
const SKIP_KEYS = new Set(['location_auto_manual', 'location', 'location_plz', 'livingSituation'])

export async function POST(req: Request) {
  try {
    const body: SubmissionPayload = await req.json()

    if (!body.location || !body.location.lat || !body.location.lng || !body.location.postal_code) {
      throw new APIError('Missing required location fields', 400)
    }

    if (!body.answers || Object.keys(body.answers).length === 0) {
      throw new APIError('Missing answers', 400)
    }

    const payload = await getPayloadClient()
    const answers = body.answers
    const warnings: string[] = []

    // --- Server-side binding resolution ---
    const answerKeys = Object.keys(answers)
    const { docs: questions } = await payload.find({
      collection: 'questions',
      where: { key: { in: answerKeys } },
      limit: answerKeys.length + 10,
      depth: 0,
      overrideAccess: true,
    })
    const bindingMap = new Map<string, SubmissionBinding>(
      questions.map((q) => [q.key, (q as any).submissionBinding ?? {}]),
    )

    // --- Build submission data from bindings (with legacy fallback) ---
    const mapped: Record<string, any> = {}
    for (const [key, value] of Object.entries(answers)) {
      if (value === undefined || value === null) continue
      if (SKIP_KEYS.has(key)) continue

      const binding = bindingMap.get(key)
      let fieldPath: string | null = null

      if (binding?.mode === 'explicitField' && binding.fieldPath) {
        fieldPath = binding.fieldPath
      } else if (binding?.mode === 'customKey') {
        warnings.push(`Custom key "${binding.customKey ?? key}" – not persisted`)
        continue
      } else {
        // No binding configured — try legacy fallback
        fieldPath = LEGACY_KEY_MAP[key] ?? null
        if (!fieldPath) {
          warnings.push(`No binding for answer key "${key}"`)
          continue
        }
      }

      if (fieldPath === 'location') {
        applyLocationBinding(mapped, value, body.location)
      } else {
        const normalized = normalizeForField(fieldPath, value)
        if (normalized !== undefined) {
          setNestedValue(mapped, fieldPath, normalized)
        }
      }
    }

    // --- Merge location: body.location is authoritative, mapped location fields override ---
    const locationForDb = {
      lat: Number.isFinite(Number(body.location.lat)) ? Number(body.location.lat) : 0,
      lng: Number.isFinite(Number(body.location.lng)) ? Number(body.location.lng) : 0,
      postal_code: String(body.location.postal_code).trim(),
      ...(body.location.city && { city: body.location.city.trim() }),
      ...(body.location.street && { street: body.location.street.trim() }),
      ...((mapped.location as Record<string, unknown>) ?? {}),
    }
    if (!locationForDb.postal_code || !Number.isFinite(locationForDb.lat) || !Number.isFinite(locationForDb.lng)) {
      throw new APIError('Missing or invalid location (lat, lng, postal_code required)', 400)
    }

    // --- Personal fields: merge from body + bindings ---
    const personalFieldsFromBody = body.personalFields
    const personalFieldsMerged = {
      age: personalFieldsFromBody?.age ?? (mapped.personalFields as any)?.age ?? undefined,
      gender:
        personalFieldsFromBody?.gender ??
        (mapped.personalFields as any)?.gender ??
        undefined,
      householdSize:
        personalFieldsFromBody?.householdSize ??
        (mapped.personalFields as any)?.householdSize ??
        undefined,
    }

    // --- Extract typed fields from mapped, with safe defaults ---
    const heatFrequency = (mapped.heatFrequency as string) ?? '1-3'
    const heatIntensity = (mapped.heatIntensity as number) ?? 0

    const livingSituation = {
      housingType: ((mapped.livingSituation as any)?.housingType as string) ?? 'apartment',
      greenNeighborhood: ((mapped.livingSituation as any)?.greenNeighborhood as string[]) ?? [],
      cityArea: ((mapped.livingSituation as any)?.cityArea as string) ?? 'outer',
    }

    const climateAdaptationKnowledge = {
      knowsTerm: ((mapped.climateAdaptationKnowledge as any)?.knowsTerm as boolean) ?? false,
      description:
        ((mapped.climateAdaptationKnowledge as any)?.description as string) || undefined,
    }

    const desiredChanges = Array.isArray(mapped.desiredChanges) ? mapped.desiredChanges : []
    const userText = (mapped.user_text as string) || body.freeText || undefined

    // --- Problem index ---
    const { problemIndex, subScores } = calculateSimpleProblemIndex(heatFrequency, heatIntensity)

    if (warnings.length > 0) {
      console.warn('[submit] Mapping warnings:', warnings)
    }

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
        questionnaireVersion: body.questionnaireVersion || 'v1.0',
        heatFrequency: heatFrequency as any,
        heatIntensity,
        livingSituation: livingSituation as any,
        climateAdaptationKnowledge,
        desiredChanges,
        problem_index: Math.round(problemIndex),
        sub_scores: subScores,
        user_text: userText,
      },
      overrideAccess: false,
    })

    revalidateTag('heatmap-grid')
    revalidateTag('heatmap')

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
