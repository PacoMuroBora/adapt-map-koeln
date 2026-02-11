import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import RichText from '@/components/RichText'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { SiteSetting } from '@/payload-types'

export async function generateStaticParams() {
  return [
    { page: 'impressum' },
    { page: 'privacy' },
    { page: 'terms' },
  ]
}

type Args = {
  params: Promise<{
    page: string
  }>
}

export default async function LegalPage({ params: paramsPromise }: Args) {
  const { page } = await paramsPromise
  const siteSettings = (await getCachedGlobal('site-settings', 0)()) as SiteSetting

  if (!siteSettings?.legalContent) {
    return notFound()
  }

  let content
  let title

  switch (page) {
    case 'impressum':
      content = siteSettings.legalContent.impressum
      title = 'Impressum'
      break
    case 'privacy':
      content = siteSettings.legalContent.privacyPolicy
      title = 'Datenschutzerklärung'
      break
    case 'terms':
      content = siteSettings.legalContent.termsAndConditions
      title = 'AGB'
      break
    default:
      return notFound()
  }

  if (!content) {
    return notFound()
  }

  return (
    <article className="container mx-auto px-4 py-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:mb-8">{title}</h1>
        <div className="prose prose-lg max-w-none">
          <RichText data={content} enableGutter={false} />
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { page } = await paramsPromise

  let title: string
  let description: string

  switch (page) {
    case 'impressum':
      title = 'Impressum'
      description = 'Impressum und rechtliche Angaben'
      break
    case 'privacy':
      title = 'Datenschutzerklärung'
      description = 'Datenschutzerklärung und Informationen zum Datenschutz'
      break
    case 'terms':
      title = 'AGB'
      description = 'Allgemeine Geschäftsbedingungen'
      break
    default:
      title = 'Seite nicht gefunden'
      description = ''
  }

  return {
    title,
    description,
  }
}

