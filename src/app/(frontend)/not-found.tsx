import React from 'react'

import { LandingBackground } from '@/components/background/LandingBackground'
import { CMSLink } from '@/components/Link'

export default function NotFound() {
  return (
    <LandingBackground>
      <div className="container flex flex-col items-center justify-center min-h-screen gap-2 text-black">
        <div>
          <h1 className="text-deco uppercase text-center">404</h1>
          <p className="mb-4 text-body">This page could not be found.</p>
        </div>
        <CMSLink
          appearance="white"
          size="default"
          iconBefore="arrow-left"
          url="/"
          label="Zurück zur Startseite"
        />
      </div>
    </LandingBackground>
  )
}
