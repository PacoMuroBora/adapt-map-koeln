import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { getDistrictForPlz } from '@/utilities/colognePlz'

/**
 * GET /api/submissions/count-by-plz?postalCode=51063
 * Returns the number of submissions for the given postal code (PLZ), district (Stadtteil) and optional city.
 * Public endpoint for the results page headline ("Du bist die X. Person aus Y die mitgemacht hat.").
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode')?.trim()

    if (!postalCode) {
      return NextResponse.json({ error: 'Missing postalCode query parameter' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'submissions',
      where: {
        'location.postal_code': { equals: postalCode },
      },
      limit: 1,
      depth: 0,
      select: { location: true },
      overrideAccess: true, // Public aggregate count only; no personal data returned
    })

    const count = result.totalDocs ?? 0
    const city =
      result.docs[0] && typeof result.docs[0].location === 'object' && result.docs[0].location?.city
        ? String(result.docs[0].location.city).trim()
        : null
    const districtName = getDistrictForPlz(postalCode)

    return NextResponse.json(
      { count, districtName: districtName ?? null, city: city || null },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch (error) {
    console.error('count-by-plz error:', error)
    return NextResponse.json(
      { error: 'Failed to get submission count' },
      { status: 500 },
    )
  }
}
