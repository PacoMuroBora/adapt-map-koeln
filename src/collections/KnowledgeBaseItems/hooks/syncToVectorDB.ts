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
    doc.title_de !== previousDoc.title_de ||
    JSON.stringify(doc.content_de) !== JSON.stringify(previousDoc.content_de) ||
    JSON.stringify(doc.tags) !== JSON.stringify(previousDoc.tags) ||
    doc.category !== previousDoc.category

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
export const deleteKnowledgeBaseFromVectorDB: CollectionAfterDeleteHook<KnowledgeBaseItem> = async ({
  id,
  req: { payload, context },
}) => {
  // Skip if sync is disabled
  if (context.skipKBSync) {
    return
  }

  await triggerKBSync('delete', String(id), payload)
}

/**
 * Trigger n8n webhook to sync KB item
 */
async function triggerKBSync(
  action: 'create' | 'update' | 'delete',
  kbItemId: string,
  payload: any,
): Promise<void> {
  try {
    const webhookUrl = await getN8nWebhookUrl('kbSync')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        kbItemId,
        trigger: 'webhook',
      }),
    })

    if (!response.ok) {
      payload.logger.error(
        `Failed to trigger KB sync for ${kbItemId}: ${response.status} ${response.statusText}`,
      )
      // Don't throw - we don't want to fail the Payload operation if sync fails
    } else {
      payload.logger.info(`KB sync triggered for ${kbItemId} (${action})`)
    }
  } catch (error: any) {
    payload.logger.error(`Error triggering KB sync for ${kbItemId}: ${error.message}`)
    // Don't throw - we don't want to fail the Payload operation if sync fails
  }
}

