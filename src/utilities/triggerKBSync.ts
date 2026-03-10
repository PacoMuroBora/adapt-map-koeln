import { getN8nWebhookUrl } from './getN8nWebhookUrl'
import type { Payload } from 'payload'

interface SyncResult {
  success: boolean
  message: string
  embeddingMetadata?: {
    embedding_id?: string
    model?: string
    dimensions?: number
    last_synced?: string
  }
}

/**
 * Trigger KB sync via n8n webhook and update embedding metadata if present
 * Used by both hooks and API endpoints
 */
export async function triggerKBSync(
  action: 'create' | 'update' | 'delete',
  kbItemId: string,
  payload: Payload,
  options?: {
    trigger?: string
    updateMetadata?: boolean
  },
): Promise<SyncResult> {
  const webhookUrl = await getN8nWebhookUrl('kbSync')
  const trigger = options?.trigger || 'webhook'
  const shouldUpdateMetadata = options?.updateMetadata !== false // Default to true

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      kbItemId,
      trigger,
    }),
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(`KB sync failed: ${response.status} ${response.statusText} - ${responseText}`)
  }

  // Parse response
  let responseData: any
  try {
    responseData = JSON.parse(responseText)
  } catch (parseError) {
    throw new Error(
      `KB sync response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
    )
  }

  // Check if workflow run was successful
  if (!responseData.success) {
    throw new Error(`KB sync workflow failed: ${responseData.message || 'Unknown error'}`)
  }

  // Update embedding metadata if present and updateMetadata is enabled.
  // Defer the write so it runs after the triggering save commits, avoiding MongoDB
  // "Write conflict during plan execution" when the hook runs inside payload.update().
  if (shouldUpdateMetadata && responseData.embeddingMetadata) {
    const metadataToUpdate = {
      embedding_id: responseData.embeddingMetadata.embedding_id || undefined,
      model: responseData.embeddingMetadata.model || undefined,
      dimensions: responseData.embeddingMetadata.dimensions || undefined,
      last_synced: responseData.embeddingMetadata.last_synced || undefined,
    }

    const doMetadataUpdate = (retryCount = 0) => {
      payload
        .update({
          collection: 'knowledge-base-items',
          id: kbItemId,
          data: { embeddingMetadata: metadataToUpdate },
          overrideAccess: true,
          context: { skipKBSync: true },
        })
        .catch((metaErr: unknown) => {
          const isWriteConflict =
            metaErr &&
            typeof metaErr === 'object' &&
            'message' in metaErr &&
            typeof (metaErr as Error).message === 'string' &&
            ((metaErr as Error).message.includes('Write conflict') ||
              (metaErr as Error).message.includes('yielding'))
          if (isWriteConflict && retryCount < 2) {
            setTimeout(() => doMetadataUpdate(retryCount + 1), 150 * (retryCount + 1))
          }
        })
    }

    setImmediate(doMetadataUpdate)

    return {
      success: true,
      message: 'Sync completed and metadata updated successfully',
      embeddingMetadata: metadataToUpdate,
    }
  }

  return {
    success: true,
    message: responseData.message || 'Sync completed successfully',
    embeddingMetadata: responseData.embeddingMetadata,
  }
}
