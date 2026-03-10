import { getPayloadClient } from '@/lib/payload'
import type { Page } from '@/payload-types'
import { draftMode } from 'next/headers'
import { cache } from 'react'

/**
 * Cached fetch of a page by slug. Used by homepage (slug 'home') and [slug] route.
 */
export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: { slug: { equals: slug } },
  })
  return result.docs?.[0] ?? null
})
