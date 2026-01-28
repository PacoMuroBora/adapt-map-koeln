import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { Submission } from '../../../payload-types'

function revalidateHeatmapCache(req: { payload: any; context?: any }) {
  if (req.context?.disableRevalidate) return

  req.payload.logger.info('Revalidating heatmap cache after submission change')

  // Revalidate base tag (invalidates all tile sizes)
  revalidateTag('heatmap-grid')

  // Also revalidate the base heatmap API cache
  revalidateTag('heatmap')
}

export const revalidateHeatmapAfterChange: CollectionAfterChangeHook<Submission> = ({ req }) => {
  revalidateHeatmapCache(req)
}

export const revalidateHeatmapAfterDelete: CollectionAfterDeleteHook<Submission> = ({ req }) => {
  revalidateHeatmapCache(req)
}
