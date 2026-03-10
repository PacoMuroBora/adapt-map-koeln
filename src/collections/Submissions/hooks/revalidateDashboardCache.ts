import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'

import { revalidateTag } from 'next/cache'

import { DASHBOARD_CACHE_TAGS } from '@/lib/dashboard-cache'

import type { Submission } from '../../../payload-types'

function revalidateSubmissionDashboardCache(req: { context?: { disableRevalidate?: boolean } }) {
  if (req.context?.disableRevalidate) return

  revalidateTag(DASHBOARD_CACHE_TAGS.submissions)
  revalidateTag(DASHBOARD_CACHE_TAGS.submissionsAnalytics)
}

export const revalidateDashboardCacheAfterChange: CollectionAfterChangeHook<Submission> = ({
  doc,
  req,
}) => {
  revalidateSubmissionDashboardCache(req)
  if (doc?.id) {
    revalidateTag(DASHBOARD_CACHE_TAGS.submission(String(doc.id)))
  }
}

export const revalidateDashboardCacheAfterDelete: CollectionAfterDeleteHook<Submission> = ({
  id,
  req,
}) => {
  revalidateSubmissionDashboardCache(req)
  if (id) {
    revalidateTag(DASHBOARD_CACHE_TAGS.submission(String(id)))
  }
}
