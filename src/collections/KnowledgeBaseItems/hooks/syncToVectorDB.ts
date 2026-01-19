import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { triggerKBSync as triggerKBSyncUtil } from '../../../utilities/triggerKBSync'

import type { KnowledgeBaseItem } from '../../../payload-types'

/**
 * Hook to sync Knowledge Base items to vector database via n8n webhook
 * Only syncs when status is 'published' and content has changed
 */
export const syncKnowledgeBaseToVectorDB: CollectionAfterChangeHook<KnowledgeBaseItem> = async ({
  doc,
  previousDoc,
  operation,
  req: { payload, context },
}) => {
  // Skip if sync is disabled (e.g., during bulk operations)
  if (context.skipKBSync) {
    return doc
  }

  // Only sync published items
  if (doc.status !== 'published') {
    // If item was unpublished, trigger delete sync
    if (previousDoc?.status === 'published') {
      await triggerKBSync('delete', String(doc.id), payload)
    }
    return doc
  }

  // Check if content actually changed (to avoid unnecessary syncs)
  const contentChanged =
    !previousDoc ||
    doc.companyOrTip?.company !== previousDoc.companyOrTip?.company ||
    doc.companyOrTip?.tip !== previousDoc.companyOrTip?.tip ||
    doc.description !== previousDoc.description ||
    doc.problems_solved !== previousDoc.problems_solved ||
    JSON.stringify(doc.categories) !== JSON.stringify(previousDoc.categories) ||
    JSON.stringify(doc.keywords) !== JSON.stringify(previousDoc.keywords)

  // Only sync if content changed or it's a new item
  if (contentChanged || operation === 'create') {
    const action = operation === 'create' ? 'create' : 'update'
    await triggerKBSync(action, String(doc.id), payload)
  }

  return doc
}

/**
 * Hook to handle deletion - remove from vector database
 */
export const deleteKnowledgeBaseFromVectorDB: CollectionAfterDeleteHook<
  KnowledgeBaseItem
> = async ({ id, req: { payload, context } }) => {
  // Skip if sync is disabled
  if (context.skipKBSync) {
    return
  }

  await triggerKBSync('delete', String(id), payload)
}

/**
 * Queue to ensure sequential processing of KB sync requests
 */
const syncQueue: Array<{
  action: 'create' | 'update' | 'delete'
  kbItemId: string
  payload: any
  resolve: () => void
  reject: (error: Error) => void
}> = []

let isProcessingQueue = false

/**
 * Process sync queue sequentially
 */
async function processSyncQueue(): Promise<void> {
  if (isProcessingQueue || syncQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  while (syncQueue.length > 0) {
    const item = syncQueue.shift()
    if (!item) break

    try {
      await triggerKBSyncUtil(item.action, item.kbItemId, item.payload, {
        trigger: 'webhook',
        updateMetadata: true,
      })
      item.resolve()
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  isProcessingQueue = false
}

/**
 * Trigger n8n webhook to sync KB item (queued, sequential)
 */
async function triggerKBSync(
  action: 'create' | 'update' | 'delete',
  kbItemId: string,
  payload: any,
): Promise<void> {
  return new Promise((resolve, reject) => {
    syncQueue.push({ action, kbItemId, payload, resolve, reject })
    processSyncQueue().catch(reject)
  })
}
