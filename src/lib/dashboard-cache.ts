import { unstable_cache } from 'next/cache'

import { getPayloadClient } from '@/lib/payload'
import type { Config } from '@/payload-types'

/** Revalidate cached dashboard data every 2.5 minutes. */
const REVALIDATE_SEC = 150

const TAGS = {
  submissions: 'dashboard-submissions',
  submission: (id: string) => `dashboard-submission-${id}`,
  kbList: 'dashboard-kb-list',
  kbDoc: (id: string) => `dashboard-kb-${id}`,
  kbAnalytics: 'dashboard-kb-analytics',
  submissionsAnalytics: 'dashboard-submissions-analytics',
  global: (slug: string) => `dashboard-global-${slug}`,
} as const

export async function getCachedSubmissionsList(limit: number, page: number) {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.find({
        collection: 'submissions',
        depth: 0,
        limit,
        page,
        sort: '-createdAt',
        overrideAccess: true,
      })
    },
    ['dashboard', 'submissions', 'list', String(limit), String(page)],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.submissions] },
  )()
}

export async function getCachedSubmissionById(id: string) {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.findByID({
        collection: 'submissions',
        id,
        depth: 0,
        overrideAccess: true,
      })
    },
    ['dashboard', 'submissions', 'doc', id],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.submissions, TAGS.submission(id)] },
  )()
}

export async function getCachedKnowledgeBaseList() {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.find({
        collection: 'knowledge-base-items',
        depth: 0,
        limit: 100,
        sort: '-createdAt',
        overrideAccess: true,
      })
    },
    ['dashboard', 'knowledge-base', 'list'],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.kbList] },
  )()
}

export async function getCachedKnowledgeBaseItemById(id: string) {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.findByID({
        collection: 'knowledge-base-items',
        id,
        depth: 0,
        overrideAccess: true,
      })
    },
    ['dashboard', 'knowledge-base', 'doc', id],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.kbList, TAGS.kbDoc(id)] },
  )()
}

const RANGE_TO_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '180d': 180,
  '365d': 365,
}

export async function getCachedSubmissionsAnalytics(range: string) {
  const days = RANGE_TO_DAYS[range] ?? 7
  return unstable_cache(
    async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const payload = await getPayloadClient()
      return payload.find({
        collection: 'submissions',
        depth: 0,
        limit: 5000,
        sort: 'metadata.timestamp',
        where: {
          'metadata.timestamp': {
            greater_than_equal: since.toISOString(),
          },
        },
        overrideAccess: true,
      })
    },
    ['dashboard', 'submissions', 'analytics', range],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.submissionsAnalytics] },
  )()
}

export async function getCachedKnowledgeBaseAnalytics(range: string) {
  const days = RANGE_TO_DAYS[range] ?? 7
  return unstable_cache(
    async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
      const payload = await getPayloadClient()
      return payload.find({
        collection: 'knowledge-base-recommendation-events',
        depth: 0,
        limit: 5000,
        sort: 'recommendedAt',
        where: {
          recommendedAt: {
            greater_than_equal: since.toISOString(),
          },
        },
        overrideAccess: true,
      })
    },
    ['dashboard', 'knowledge-base', 'analytics', range],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.kbAnalytics] },
  )()
}

export async function getCachedGlobal(slug: string) {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({
        slug: slug as keyof Config['globals'],
        depth: 0,
        overrideAccess: true,
      })
    },
    ['dashboard', 'global', slug],
    { revalidate: REVALIDATE_SEC, tags: [TAGS.global(slug)] },
  )()
}

export { TAGS as DASHBOARD_CACHE_TAGS }
