import { NextRequest, NextResponse } from 'next/server'

const GEOCODING_URL = process.env.NEXT_PUBLIC_GEOCODING_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const response = await fetch(
      `${GEOCODING_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AdaptMapKoeln/1.0',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }

    const data = await response.json()

    return NextResponse.json({
      postal_code: data.address?.postcode || null,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      address: data.display_name,
    })
  } catch (error: any) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json({ error: 'Failed to reverse geocode location' }, { status: 500 })
  }
}

