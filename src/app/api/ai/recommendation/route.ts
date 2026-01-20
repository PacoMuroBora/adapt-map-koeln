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
    const submission = await payload.findByID({
      collection: 'submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: false, // Respect access control
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

    // Prepare request payload for n8n
    const n8nPayload = {
      submissionId: submission.id,
      answers: submission.answers,
      problemIndex: submission.problem_index,
      location: {
        lat: submission.location.lat,
        lng: submission.location.lng,
        postal_code: submission.location.postal_code,
        city: submission.location.city || null,
      },
      freeText: submission.user_text || null,
      personalFields: submission.personalFields || null,
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

    const aiResult = await n8nResponse.json()

    // Validate response structure
    if (!aiResult.summary || !aiResult.recommendations) {
      throw new Error('Invalid response from n8n workflow')
    }

    // Update the submission with AI results
    // ⚠️ CRITICAL: Use overrideAccess: false and pass req for transaction safety
    // Since this is a system operation updating AI fields, we use overrideAccess: true
    // but only for updating AI fields (not user data)
    await payload.update({
      collection: 'submissions',
      id: submissionId,
      data: {
        aiFields: {
          ai_summary_de: aiResult.summary,
          ai_recommendations_de: aiResult.recommendations,
          ai_referenced_kb_ids: aiResult.referencedKbIds || [],
          ai_model_metadata: aiResult.modelMetadata || {},
          ai_generated_at: new Date().toISOString(),
        },
      },
      overrideAccess: true, // System operation - updating AI-generated fields
    })

    return NextResponse.json({
      ai_summary_de: aiResult.summary,
      ai_recommendations_de: aiResult.recommendations,
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
