import { NextRequest, NextResponse } from 'next/server'

const N8N_ENDPOINT = process.env.N8N_RECOMMENDATION_ENDPOINT

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    // TODO: Implement n8n integration in task 7
    // For now, return a placeholder response
    if (!N8N_ENDPOINT) {
      return NextResponse.json(
        {
          error: 'AI recommendation service not configured',
          message: 'This feature will be available after n8n integration is set up.',
        },
        { status: 503 },
      )
    }

    // Future implementation:
    // const response = await fetch(N8N_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ submissionId }),
    // })
    // ... handle response

    return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 })
  } catch (error: any) {
    console.error('AI recommendation error:', error)
    return NextResponse.json({ error: 'Failed to generate AI recommendation' }, { status: 500 })
  }
}
