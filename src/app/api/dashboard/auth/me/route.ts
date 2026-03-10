import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import type { PayloadRequest } from 'payload'

export async function GET(request: Request) {
  try {
    const payload = await getPayloadClient()

    const authResult = await payload.auth({
      headers: request.headers,
    } as PayloadRequest)

    if (!authResult?.user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json(
      {
        user: authResult.user,
      },
      { status: 200 },
    )
  } catch (error) {
    // If auth throws, treat as unauthenticated for this helper endpoint
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

