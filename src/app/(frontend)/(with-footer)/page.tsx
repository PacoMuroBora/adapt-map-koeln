import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HeatmapMap } from '@/components/HeatmapMap'
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
    'Berichte über hitzebezogene Probleme in Deiner Umgebung.'
  const ctaButton = uiData?.landingPage?.ctaButton || "Los geht's"

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        {/* CTA Section */}
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-12">{description}</p>
          )}
          <Button
            href="/questionnaire/current"
            iconAfter={null}
            iconBefore={null}
            newTab={false}
            shape="round"
            size="lg"
            variant="default"
          >
            {ctaButton}
          </Button>
        </div>

        {/* Heatmap */}
        <Card className="relative h-[600px] w-full overflow-hidden">
          <HeatmapMap className="h-full w-full" />
        </Card>
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = (await getCachedGlobal('site-settings', 0)()) as SiteSetting

  return {
    title: siteSettings?.siteName || 'AdaptMap Köln',
    description:
      siteSettings?.siteDescription || 'Berichte über hitzebezogene Probleme in Deiner Umgebung.',
  }
}
