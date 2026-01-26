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
  const siteSettings = (await getCachedGlobal('site-settings', 1)()) as SiteSetting

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

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = (await getCachedGlobal('site-settings', 1)()) as SiteSetting
  const serverUrl = getServerSideURL()

  const title = siteSettings?.metaTitle || siteSettings?.siteName || 'AdaptMap Köln'
  const description = siteSettings?.metaDescription || siteSettings?.siteDescription || ''
  
  // Get OG image URL
  let ogImageUrl = `${serverUrl}/website-template-OG.webp`
  if (siteSettings?.ogImage && typeof siteSettings.ogImage === 'object' && 'url' in siteSettings.ogImage) {
    const ogUrl = siteSettings.ogImage.sizes?.og?.url
    ogImageUrl = ogUrl ? serverUrl + ogUrl : serverUrl + siteSettings.ogImage.url
  }

  // Build Twitter handle
  const twitterHandle = siteSettings?.twitterHandle
    ? `@${siteSettings.twitterHandle.replace('@', '')}`
    : undefined

  return {
    metadataBase: new URL(serverUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords: siteSettings?.keywords?.split(',').map(k => k.trim()).filter(Boolean),
    openGraph: mergeOpenGraph({
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: siteSettings?.siteName || title,
    }),
    twitter: {
      card: 'summary_large_image',
      ...(twitterHandle && { creator: twitterHandle }),
    },
  }
}
