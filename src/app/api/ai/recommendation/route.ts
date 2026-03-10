import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getN8nWebhookUrl } from '@/utilities/getN8nWebhookUrl'
import type { KnowledgeBaseItem, Submission } from '@/payload-types'

const HEAT_FREQUENCY_LABELS: Record<string, string> = {
  '1-3': '1 – 3 Tage pro Jahr',
  '4-10': '4 – 10 Tage pro Jahr',
  '11-20': '11 – 20 Tage pro Jahr',
  '21-40': '21 – 40 Tage pro Jahr',
  '>40': 'Mehr als 40 Tage pro Jahr',
}

const HOUSING_TYPE_LABELS: Record<string, string> = {
  apartment: 'In einer Wohnung',
  house: 'In einem Haus',
}

const CITY_AREA_LABELS: Record<string, string> = {
  inner: 'Innenstadt',
  outer: 'Äußerer Bereich / Stadtrand',
}

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  open_streets: 'Offene Straßen',
  greenery: 'Viel begrünt',
  main_road: 'Hauptstraße',
  park: 'Parknähe',
  no_greenery: 'Keine Begrünung',
  river: 'Flussnähe',
  closed_surfaces: 'Versiegelte Flächen',
}

const DESIRED_CHANGES_LABELS: Record<string, string> = {
  schatten: 'Verschattung',
  cooling: 'Schatten kreieren',
  dachbegruenung: 'Dachbegrünung anlegen',
  strassenbegruenung: 'Straßenbegrünung anlegen',
  wasserstellen: 'Wasserstellen anlegen',
}

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    // Get the submission
    // Using overrideAccess: true because:
    // 1. This is a system operation (generating AI recommendations)
    // 2. Users can only access submissions they know the ID of
    // 3. We're not exposing sensitive data, just using it to generate recommendations
    const submission = (await payload.findByID({
      collection: 'submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: true, // Allow reading for AI recommendation generation
    })) as Submission

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if AI recommendation already exists
    if (submission.aiFields?.ai_summary_de && submission.aiFields?.ai_recommendations_de) {
      return NextResponse.json({
        ai_summary_de: submission.aiFields.ai_summary_de,
        ai_recommendations_de: submission.aiFields.ai_recommendations_de,
        ai_generated_at: submission.aiFields.ai_generated_at,
        kbItems: [],
      })
    }

    // Get n8n webhook URL
    const n8nEndpoint = await getN8nWebhookUrl('aiRecommendation')

    const ls = submission.livingSituation
    const greenNeighborhood = Array.isArray(ls?.greenNeighborhood)
      ? ls.greenNeighborhood
      : ls?.greenNeighborhood
        ? [ls.greenNeighborhood]
        : []

    const n8nPayload = {
      submissionId: submission.id,
      metadata: submission.metadata || null,
      location: {
        lat: submission.location.lat,
        lng: submission.location.lng,
        postal_code: submission.location.postal_code,
        city: submission.location.city || null,
        street: submission.location.street || null,
      },
      personalFields: submission.personalFields || null,
      questionnaireVersion: submission.questionnaireVersion,
      heatFrequency: HEAT_FREQUENCY_LABELS[submission.heatFrequency] ?? submission.heatFrequency,
      heatIntensity: submission.heatIntensity,
      livingSituation: ls
        ? {
            housingType: HOUSING_TYPE_LABELS[ls.housingType] ?? ls.housingType,
            greenNeighborhood: greenNeighborhood.map(
              (v: string) => NEIGHBORHOOD_LABELS[v] ?? v,
            ),
            cityArea: CITY_AREA_LABELS[ls.cityArea] ?? ls.cityArea,
          }
        : null,
      climateAdaptationKnowledge: submission.climateAdaptationKnowledge
        ? {
            knowsTerm: submission.climateAdaptationKnowledge.knowsTerm ? 'Ja' : 'Nein',
            description: submission.climateAdaptationKnowledge.description || null,
          }
        : null,
      desiredChanges: Array.isArray(submission.desiredChanges)
        ? submission.desiredChanges.map((d) => DESIRED_CHANGES_LABELS[d.icon] ?? d.icon)
        : null,
      problemIndex: submission.problem_index,
      subScores: submission.sub_scores || null,
      freeText: submission.user_text || null,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    }

    // Call n8n endpoint
    const n8nResponse = await fetch(n8nEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => 'Unknown error')
      console.error('n8n error:', n8nResponse.status, errorText)
      throw new Error(`n8n error: ${n8nResponse.status}`)
    }

    const rawResult = await n8nResponse.json()
    // n8n often returns an array of items; we support both array + object shapes
    const aiResult = Array.isArray(rawResult) ? rawResult[0] : rawResult

    // Validate response structure
    if (
      !aiResult ||
      typeof aiResult !== 'object' ||
      !aiResult.summary ||
      !aiResult.recommendations
    ) {
      throw new Error('Invalid response from n8n workflow')
    }

    const kbItemsFromN8n = Array.isArray((aiResult as any).kbItems)
      ? ((aiResult as any).kbItems as unknown[])
      : []

    const referencedKbIdsFromResponse = Array.isArray((aiResult as any).referencedKbIds)
      ? ((aiResult as any).referencedKbIds as unknown[]).filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        )
      : []

    const referencedKbIdsFromKbItems = kbItemsFromN8n
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const id = (item as { id?: unknown; _id?: unknown }).id ?? (item as { _id?: unknown })._id
        return typeof id === 'string' && id.length > 0 ? id : null
      })
      .filter((id): id is string => Boolean(id))

    const referencedKbIds = Array.from(
      new Set([...referencedKbIdsFromResponse, ...referencedKbIdsFromKbItems]),
    )

    const nowISO = new Date().toISOString()

    // Return quickly with the full kbItems from n8n.
    // Persistence can happen in the background.
    const response = NextResponse.json({
      ai_summary_de: (aiResult as any).summary,
      ai_recommendations_de: (aiResult as any).recommendations,
      ai_generated_at: nowISO,
      kbItems: kbItemsFromN8n,
    })

    void (async () => {
      try {
        // Resolve and validate referenced KB items
        const resolvedKbItems: KnowledgeBaseItem[] = []
        for (const kbId of referencedKbIds) {
          try {
            const kb = (await payload.findByID({
              collection: 'knowledge-base-items',
              id: kbId,
              depth: 0,
              overrideAccess: true,
            })) as KnowledgeBaseItem
            if (kb) {
              resolvedKbItems.push(kb)
            }
          } catch {
            // Ignore invalid IDs
          }
        }

        const validKbIds = resolvedKbItems.map((kb) => String(kb.id))

        // Update the submission with AI results
        // ⚠️ CRITICAL: Use overrideAccess: true here because this is a trusted system-side operation
        // that only updates AI-managed fields.
        await payload.update({
          collection: 'submissions',
          id: submissionId,
          data: {
            aiFields: {
              ai_summary_de: (aiResult as any).summary,
              ai_recommendations_de: (aiResult as any).recommendations,
              ai_referenced_kb_ids: validKbIds,
              ai_model_metadata: (aiResult as any).modelMetadata || {},
              ai_generated_at: nowISO,
            },
          },
          overrideAccess: true,
        })

        // Persist recommendation usage events for analytics
        for (const kb of resolvedKbItems) {
          try {
            await payload.create({
              collection: 'knowledge-base-recommendation-events',
              data: {
                kbItem: kb.id,
                submission: submission.id,
                source: 'ai-recommendation',
                recommendedAt: nowISO,
                theme: kb.theme,
                solution_type: kb.solution_type,
                postal_code: submission.location?.postal_code,
                categories: Array.isArray(kb.categories)
                  ? kb.categories.map((value) => ({ value }))
                  : undefined,
              },
              overrideAccess: true,
            })
          } catch (eventError) {
            console.error('Failed to create KB recommendation event', eventError)
          }
        }
      } catch (backgroundError) {
        console.error('Failed to persist AI recommendation data', backgroundError)
      }
    })()

    return response
  } catch (error: any) {
    console.error('AI recommendation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI recommendation' },
      { status: 500 },
    )
  }
}
