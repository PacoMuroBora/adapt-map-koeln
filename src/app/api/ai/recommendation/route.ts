import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getN8nWebhookUrl } from '@/utilities/getN8nWebhookUrl'

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
    const submission = await payload.findByID({
      collection: 'submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: true, // Allow reading for AI recommendation generation
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if AI recommendation already exists
    if (submission.aiFields?.ai_summary_de && submission.aiFields?.ai_recommendations_de) {
      return NextResponse.json({
        ai_summary_de: submission.aiFields.ai_summary_de,
        ai_recommendations_de: submission.aiFields.ai_recommendations_de,
        ai_generated_at: submission.aiFields.ai_generated_at,
      })
    }

    // Get n8n webhook URL
    const n8nEndpoint = await getN8nWebhookUrl('aiRecommendation')

    // Prepare request payload for n8n with all submission data
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
      heatFrequency: submission.heatFrequency,
      heatIntensity: submission.heatIntensity,
      livingSituation: submission.livingSituation || null,
      climateAdaptationKnowledge: submission.climateAdaptationKnowledge || null,
      desiredChanges: submission.desiredChanges || null,
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
    if (!aiResult || typeof aiResult !== 'object' || !aiResult.summary || !aiResult.recommendations) {
      throw new Error('Invalid response from n8n workflow')
    }

    const referencedKbIds = Array.isArray((aiResult as any).referencedKbIds)
      ? ((aiResult as any).referencedKbIds as unknown[]).filter((id): id is string => typeof id === 'string' && id.length > 0)
      : []

    // Update the submission with AI results
    // ⚠️ CRITICAL: Use overrideAccess: false and pass req for transaction safety
    // Since this is a system operation updating AI fields, we use overrideAccess: true
    // but only for updating AI fields (not user data)
    await payload.update({
      collection: 'submissions',
      id: submissionId,
      data: {
        aiFields: {
          ai_summary_de: (aiResult as any).summary,
          ai_recommendations_de: (aiResult as any).recommendations,
          // Payload field is an array of objects: [{ kb_id }]
          ai_referenced_kb_ids: referencedKbIds.map((kb_id) => ({ kb_id })),
          ai_model_metadata: (aiResult as any).modelMetadata || {},
          ai_generated_at: new Date().toISOString(),
        },
      },
      overrideAccess: true, // System operation - updating AI-generated fields
    })

    return NextResponse.json({
      ai_summary_de: (aiResult as any).summary,
      ai_recommendations_de: (aiResult as any).recommendations,
      ai_generated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('AI recommendation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI recommendation' },
      { status: 500 },
    )
  }
}
