import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { triggerKBSync as triggerKBSyncUtil } from '../../../utilities/triggerKBSync'

import type { KnowledgeBaseItem } from '../../../payload-types'

/**
 * Hook to sync Knowledge Base items to vector database via n8n webhook.
 * AI/vector sync runs only when status is 'published'. Draft/archived saves do not sync.
 * Unpublishing (status was published → draft/archived) triggers a delete in the vector DB.
 */
export const syncKnowledgeBaseToVectorDB: CollectionAfterChangeHook<KnowledgeBaseItem> = async ({
  doc,
  previousDoc,
  operation,
  req: { payload, context },
}) => {
  if (context.skipKBSync) {
    return doc
  }

  // Only run AI/vector sync for published entries
  if (doc.status !== 'published') {
    if (previousDoc?.status === 'published') {
      await triggerKBSync('delete', String(doc.id), payload)
    }
    return doc
  }

  // Check if content actually changed (any field editable from dashboard or admin)
  const contentChanged =
    !previousDoc ||
    doc.companyOrTip?.company !== previousDoc.companyOrTip?.company ||
    doc.companyOrTip?.tip !== previousDoc.companyOrTip?.tip ||
    doc.displayTitle !== previousDoc.displayTitle ||
    doc.description !== previousDoc.description ||
    doc.problems_solved !== previousDoc.problems_solved ||
    doc.link !== previousDoc.link ||
    doc.solution_type !== previousDoc.solution_type ||
    doc.theme !== previousDoc.theme ||
    doc.location !== previousDoc.location ||
    doc.use_case !== previousDoc.use_case ||
    doc.applicable_when !== previousDoc.applicable_when ||
    doc.additional_context !== previousDoc.additional_context ||
    JSON.stringify(doc.categories) !== JSON.stringify(previousDoc.categories) ||
    JSON.stringify(doc.keywords) !== JSON.stringify(previousDoc.keywords)

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
