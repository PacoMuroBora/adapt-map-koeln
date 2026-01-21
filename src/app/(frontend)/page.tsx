import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { SiteSetting, UiCopy } from '@/payload-types'

export const revalidate = 600

export default async function LandingPage() {
  const [siteSettings, uiCopy] = await Promise.all([
    getCachedGlobal('site-settings', 0)(),
    getCachedGlobal('ui-copy', 0)(),
  ])

  const siteData = siteSettings as SiteSetting
  const uiData = uiCopy as UiCopy

  const title = uiData?.landingPage?.title || siteData?.siteName || 'AdaptMap Köln'
  const description =
    uiData?.landingPage?.description ||
    siteData?.siteDescription ||
    'Berichten Sie über hitzebezogene Probleme in Ihrer Umgebung.'
  const ctaButton = uiData?.landingPage?.ctaButton || "Los geht's"

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-8 md:py-16">
      <div className="container mx-auto max-w-2xl text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
        {description && (
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-12">{description}</p>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/location">{ctaButton}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/heatmap">Heatmap anzeigen</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = (await getCachedGlobal('site-settings', 0)()) as SiteSetting

  return {
    title: siteSettings?.siteName || 'AdaptMap Köln',
    description:
      siteSettings?.siteDescription ||
      'Berichten Sie über hitzebezogene Probleme in Ihrer Umgebung.',
  }
}
