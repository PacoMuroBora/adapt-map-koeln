import { NextRequest, NextResponse } from 'next/server'
import { getN8nWebhookUrl } from '@/utilities/getN8nWebhookUrl'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 },
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio_file')
    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing or invalid audio_file' },
        { status: 400 },
      )
    }

    const webhookUrl = await getN8nWebhookUrl('audioTranscribe')
    const forwardFormData = new FormData()
    forwardFormData.append('audio_file', audioFile, 'audio.webm')

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      body: forwardFormData,
    })

    if (!n8nRes.ok) {
      const errText = await n8nRes.text()
      return NextResponse.json(
        { error: errText || `Transcription failed (${n8nRes.status})` },
        { status: n8nRes.status >= 500 ? 502 : n8nRes.status },
      )
    }

    const result = (await n8nRes.json()) as { Transcript?: string }
    const transcript =
      typeof result?.Transcript === 'string' ? result.Transcript : ''

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('[transcribe]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transcription failed' },
      { status: 500 },
    )
  }
}
