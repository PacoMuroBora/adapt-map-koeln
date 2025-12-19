import { NextRequest, NextResponse } from 'next/server'

const PHOTON_URL = process.env.NEXT_PUBLIC_PHOTON_URL || 'http://localhost:2322'

export async function POST(req: NextRequest) {
  try {
    const { street, housenumber, postalcode, city } = await req.json()

    // Build query
    const queryParts = []
    if (street) queryParts.push(street)
    if (housenumber) queryParts.push(housenumber)
    if (postalcode) queryParts.push(postalcode)
    if (city) queryParts.push(city)

    const query = queryParts.join(' ')

    const response = await fetch(
      `${PHOTON_URL}/api?q=${encodeURIComponent(query)}&limit=1&lang=de`,
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

    if (!data.features || data.features.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const feature = data.features[0]
    const [lng, lat] = feature.geometry.coordinates

    return NextResponse.json({
      lat,
      lng,
      postal_code: feature.properties.postcode || postalcode || null,
      city: feature.properties.city || feature.properties.town || city || null,
      address: feature.properties.name || query,
    })
  } catch (error: any) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 })
  }
}

