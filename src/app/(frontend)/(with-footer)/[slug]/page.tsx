import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { getPayloadClient } from '@/lib/payload'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { getPageBySlug } from '@/utilities/getPageBySlug'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => doc.slug && doc.slug !== '/')
    .map(({ slug }) => ({ slug })) ?? []

  return params
}

type Args = {
  params: Promise<{ slug?: string }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug } = await paramsPromise
  if (!slug) redirect('/')
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  const page = await getPageBySlug(decodedSlug)

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { contentBlocks } = page

  return (
    <article>
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderBlocks blocks={contentBlocks} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  if (!slug) return {}
  const decodedSlug = decodeURIComponent(slug)
  const page = await getPageBySlug(decodedSlug)
  return generateMeta({ doc: page })
}
