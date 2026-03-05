import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()

  // Best-effort removal of the Payload auth cookie; Payload also exposes
  // /api/users/logout, but clearing the token is sufficient for dashboard auth.
  cookieStore.delete('payload-token')

  const res = NextResponse.json({ success: true })

  // Explicitly expire the cookie for clients that rely on headers only
  res.headers.append(
    'Set-Cookie',
    [
      'payload-token=',
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=0',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; '),
  )

  return res
}

