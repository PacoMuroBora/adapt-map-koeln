import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { isValidColognePlz } from '@/utilities/colognePlz'

type ValidateAddressBody = {
  street?: string
  housenumber?: string
  postal_code?: string
}

/**
 * POST /api/validate-address
 * Body: { street, housenumber?, postal_code }
 * Returns { valid: true } or { valid: false, error: string }.
 * Checks that the street exists at the given PLZ (Cologne) and, if housenumber is provided, that it exists on that street.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ValidateAddressBody
    const street = typeof body.street === 'string' ? body.street.trim() : ''
    const housenumber = typeof body.housenumber === 'string' ? body.housenumber.trim() : ''
    const postal_code = typeof body.postal_code === 'string' ? body.postal_code.trim() : ''

    if (!street) {
      return NextResponse.json({ valid: false, error: 'Bitte gib eine Straße ein.' })
    }
    if (!postal_code || postal_code.length !== 5) {
      return NextResponse.json({
        valid: false,
        error: 'Bitte gib eine gültige 5-stellige Postleitzahl ein.',
      })
    }
    if (!isValidColognePlz(postal_code)) {
      return NextResponse.json({
        valid: false,
        error: 'Bitte gib eine gültige Postleitzahl von Köln ein.',
      })
    }

    const h = await headers()
    const host = h.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const base =
      process.env.VERCEL_URL != null
        ? `https://${process.env.VERCEL_URL}`
        : `${protocol}://${host}`
    const params = new URLSearchParams({ street, postcode: postal_code })
    const res = await fetch(`${base}/api/house-numbers?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json({
        valid: false,
        error:
          (data as { error?: string }).error ||
          'Adressprüfung ist derzeit nicht möglich. Bitte versuche es später erneut.',
      })
    }

    const data = (await res.json()) as {
      addresses?: Array<{ street: string; housenumber: string; postcode: string; city: string }>
    }
    const addresses = data.addresses ?? []

    if (addresses.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Diese Straße existiert nicht in der angegebenen Postleitzahl.',
      })
    }

    if (housenumber) {
      const normalized = housenumber.toLowerCase()
      const found = addresses.some(
        (a) => (a.housenumber || '').trim().toLowerCase() === normalized,
      )
      if (!found) {
        return NextResponse.json({
          valid: false,
          error: 'Diese Hausnummer existiert nicht in dieser Straße.',
        })
      }
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Validate address error:', error)
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      return NextResponse.json(
        { valid: false, error: 'Adressprüfung hat zu lange gedauert. Bitte versuche es erneut.' },
        { status: 504 },
      )
    }
    return NextResponse.json(
      {
        valid: false,
        error: 'Adressprüfung ist derzeit nicht möglich. Bitte versuche es später erneut.',
      },
      { status: 500 },
    )
  }
}
