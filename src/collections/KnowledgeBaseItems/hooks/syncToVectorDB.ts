import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { getN8nWebhookUrl } from '../../../utilities/getN8nWebhookUrl'

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
      await triggerKBSyncInternal(item.action, item.kbItemId, item.payload)
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

/**
 * Internal function to actually send the webhook request
 */
async function triggerKBSyncInternal(
  action: 'create' | 'update' | 'delete',
  kbItemId: string,
  payload: any,
): Promise<void> {
  const webhookUrl = await getN8nWebhookUrl('kbSync')

  const requestBody = {
    action,
    kbItemId,
    trigger: 'webhook',
  }

  payload.logger.info(
    `Triggering KB sync for ${kbItemId} (${action}) - URL: ${webhookUrl}`,
  )

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const responseText = await response.text()

  if (!response.ok) {
    payload.logger.error(
      `Failed to trigger KB sync for ${kbItemId}: ${response.status} ${response.statusText}`,
    )
    payload.logger.error(`Response body: ${responseText}`)
    throw new Error(
      `KB sync failed: ${response.status} ${response.statusText} - ${responseText}`,
    )
  }

  // Parse response to check for success and get embedding metadata
  try {
    const responseData = JSON.parse(responseText)
    
    // Check if workflow run was successful
    if (!responseData.success) {
      payload.logger.error(
        `KB sync workflow returned unsuccessful for ${kbItemId}: ${responseData.message || 'Unknown error'}`,
      )
      throw new Error(`KB sync workflow failed: ${responseData.message || 'Unknown error'}`)
    }
    
    // If response contains embedding metadata, update the KB item
    if (responseData.embeddingMetadata) {
      await payload.update({
        collection: 'knowledge-base-items',
        id: kbItemId,
        data: {
          embeddingMetadata: {
            embedding_id: responseData.embeddingMetadata.embedding_id || undefined,
            model: responseData.embeddingMetadata.model || undefined,
            dimensions: responseData.embeddingMetadata.dimensions || undefined,
            last_synced: responseData.embeddingMetadata.last_synced || undefined,
          },
        },
        overrideAccess: true, // System operation
        context: { skipKBSync: true }, // Prevent infinite loop
      })
      
      payload.logger.info(
        `KB sync completed and metadata updated for ${kbItemId} (${action})`,
      )
    } else {
      payload.logger.info(
        `KB sync completed successfully for ${kbItemId} (${action}) - No metadata to update`,
      )
    }
  } catch (parseError) {
    // If response is not JSON, treat as error
    payload.logger.error(
      `KB sync response parsing failed for ${kbItemId}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
    )
    throw new Error(
      `KB sync response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
    )
  }
}
