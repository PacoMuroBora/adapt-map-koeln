'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Legacy feedback route: redirect to results.
 * The questionnaire now submits from the last step when it includes consent.
 */
export default function FeedbackRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/results')
  }, [router])
  return null
}
