'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import type { SiteSetting } from '@/payload-types'
import { LinkButton } from '../ui/link-button'

type CookieBannerProps = {
  cookieBanner?: SiteSetting['cookieBanner']
}

export function CookieBanner({ cookieBanner }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if consent is already stored
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookieConsent')
      if (!consent) {
        setShowBanner(true)
      }
    }
  }, [])

  const acceptAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'all')
      setShowBanner(false)
      // Initialize analytics if needed
      // TODO: Initialize analytics tracking when implemented
    }
  }

  const acceptNecessary = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'necessary')
      setShowBanner(false)
    }
  }

  if (!showBanner || !cookieBanner) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <Card className="mx-auto max-w-4xl border shadow-lg">
        <div className="p-4 sm:p-6">
          <h3 id="cookie-banner-title" className="mb-2 text-lg font-semibold">
            {cookieBanner.title}
          </h3>
          <p id="cookie-banner-description" className="mb-4 text-sm text-muted-foreground">
            {cookieBanner.message}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button onClick={acceptAll} size="sm" className="w-full sm:w-auto">
                {cookieBanner.acceptAllText}
              </Button>
              <Button
                onClick={acceptNecessary}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                {cookieBanner.acceptNecessaryText}
              </Button>
            </div>
            <LinkButton href="/legal/privacy" size="sm" shape="round">
              {cookieBanner.privacyLinkText}
            </LinkButton>
          </div>
        </div>
      </Card>
    </div>
  )
}
