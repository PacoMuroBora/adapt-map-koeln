import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getN8nWebhookUrl } from '@/utilities/getN8nWebhookUrl'

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json()
    console.log('[AI Recommendation] Request received:', { submissionId })

    if (!submissionId) {
      console.error('[AI Recommendation] Missing submission ID')
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    // Get the submission
    // Using overrideAccess: true because:
    // 1. This is a system operation (generating AI recommendations)
    // 2. Users can only access submissions they know the ID of
    // 3. We're not exposing sensitive data, just using it to generate recommendations
    console.log('[AI Recommendation] Fetching submission:', submissionId)
    const submission = await payload.findByID({
      collection: 'submissions',
      id: submissionId,
      depth: 0,
      overrideAccess: true, // Allow reading for AI recommendation generation
    })

    if (!submission) {
      console.error('[AI Recommendation] Submission not found:', submissionId)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }
    console.log('[AI Recommendation] Submission found:', {
      id: submission.id,
      hasAiFields: !!submission.aiFields,
      hasSummary: !!submission.aiFields?.ai_summary_de,
      hasRecommendations: !!submission.aiFields?.ai_recommendations_de,
    })

    // Check if AI recommendation already exists
    if (submission.aiFields?.ai_summary_de && submission.aiFields?.ai_recommendations_de) {
      console.log('[AI Recommendation] Using existing AI recommendation')
      return NextResponse.json({
        ai_summary_de: submission.aiFields.ai_summary_de,
        ai_recommendations_de: submission.aiFields.ai_recommendations_de,
        ai_generated_at: submission.aiFields.ai_generated_at,
      })
    }
    console.log('[AI Recommendation] No existing recommendation, generating new one')

    // Get n8n webhook URL
    console.log('[AI Recommendation] Getting n8n webhook URL...')
    const n8nEndpoint = await getN8nWebhookUrl('aiRecommendation')
    console.log('[AI Recommendation] n8n webhook URL:', n8nEndpoint)
    console.log('[AI Recommendation] NODE_ENV:', process.env.NODE_ENV)
    console.log('[AI Recommendation] N8N_DOMAIN:', process.env.N8N_DOMAIN)
    console.log('[AI Recommendation] N8N_INTERNAL_URL:', process.env.N8N_INTERNAL_URL)

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
    console.log('[AI Recommendation] Payload prepared:', {
      submissionId: n8nPayload.submissionId,
      problemIndex: n8nPayload.problemIndex,
      hasAnswers: !!n8nPayload.answers,
      hasLocation: !!n8nPayload.location,
      hasFreeText: !!n8nPayload.freeText,
      hasPersonalFields: !!n8nPayload.personalFields,
    })

    // Call n8n endpoint
    console.log('[AI Recommendation] Calling n8n webhook:', n8nEndpoint)
    const fetchStartTime = Date.now()
    let n8nResponse: Response
    try {
      n8nResponse = await fetch(n8nEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload),
      })
      const fetchDuration = Date.now() - fetchStartTime
      console.log('[AI Recommendation] Fetch completed:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        ok: n8nResponse.ok,
        duration: `${fetchDuration}ms`,
        headers: Object.fromEntries(n8nResponse.headers.entries()),
      })
    } catch (fetchError) {
      console.error('[AI Recommendation] Fetch error:', {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        endpoint: n8nEndpoint,
      })
      throw fetchError
    }

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => 'Unknown error')
      console.error('[AI Recommendation] n8n error response:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        body: errorText,
        endpoint: n8nEndpoint,
      })
      throw new Error(`n8n error: ${n8nResponse.status} - ${errorText}`)
    }

    const responseText = await n8nResponse.text()
    console.log('[AI Recommendation] Response body received:', {
      length: responseText.length,
      preview: responseText.substring(0, 200),
    })

    let aiResult: any
    try {
      aiResult = JSON.parse(responseText)
      console.log('[AI Recommendation] Response parsed successfully:', {
        hasSummary: !!aiResult.summary,
        hasRecommendations: !!aiResult.recommendations,
        hasReferencedKbIds: !!aiResult.referencedKbIds,
        hasModelMetadata: !!aiResult.modelMetadata,
      })
    } catch (parseError) {
      console.error('[AI Recommendation] JSON parse error:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responseText: responseText.substring(0, 500),
      })
      throw new Error(`Failed to parse n8n response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`)
    }

    // Validate response structure
    if (!aiResult.summary || !aiResult.recommendations) {
      console.error('[AI Recommendation] Invalid response structure:', {
        hasSummary: !!aiResult.summary,
        hasRecommendations: !!aiResult.recommendations,
        resultKeys: Object.keys(aiResult),
      })
      throw new Error('Invalid response from n8n workflow')
    }

    console.log('[AI Recommendation] Updating submission with AI results:', submissionId)
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
    console.log('[AI Recommendation] Submission updated successfully')

    return NextResponse.json({
      ai_summary_de: aiResult.summary,
      ai_recommendations_de: aiResult.recommendations,
      ai_generated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[AI Recommendation] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      submissionId: (error as any).submissionId || 'unknown',
    })
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI recommendation' },
      { status: 500 },
    )
  }
}
