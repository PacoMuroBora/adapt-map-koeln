import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { draftMode } from 'next/headers'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { getPageBySlug } from '@/utilities/getPageBySlug'
import { generateMeta } from '@/utilities/generateMeta'

export const revalidate = 600

export default async function HomePage() {
  const { isEnabled: draft } = await draftMode()
  const page = await getPageBySlug('home')

  if (!page) {
    return (
      <article className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-muted-foreground">
          No homepage content yet. Create a page with slug <strong>home</strong> in Payload →
          Pages to display content here.
        </p>
      </article>
    )
  }

  const { contentBlocks } = page

  return (
    <article>
      {draft && <LivePreviewListener />}
      <PayloadRedirects disableNotFound url="/" />
      <RenderBlocks blocks={contentBlocks} />
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
  return generateMeta({ doc: page })
}
