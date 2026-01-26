import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { CookieBanner } from '@/components/CookieBanner'
import type { SiteSetting } from '@/payload-types'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = (await getCachedGlobal('site-settings', 0)()) as SiteSetting

  return (
    <html 
      lang="de" 
      suppressHydrationWarning
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
          <CookieBanner cookieBanner={siteSettings?.cookieBanner} />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
