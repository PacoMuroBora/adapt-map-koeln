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
    payload.logger.error(
      `Failed to trigger KB sync for ${kbItemId}: ${response.status} ${response.statusText}`,
    )
    throw new Error(`KB sync failed: ${response.status} ${response.statusText} - ${responseText}`)
  }

  // Parse response
  let responseData: any
  try {
    responseData = JSON.parse(responseText)
  } catch (parseError) {
    payload.logger.error(`KB sync response parsing failed for ${kbItemId}`)
    throw new Error(
      `KB sync response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
    )
  }

  // Check if workflow run was successful
  if (!responseData.success) {
    payload.logger.error(
      `KB sync workflow failed for ${kbItemId}: ${responseData.message || 'Unknown error'}`,
    )
    throw new Error(`KB sync workflow failed: ${responseData.message || 'Unknown error'}`)
  }

  // Update embedding metadata if present and updateMetadata is enabled
  if (shouldUpdateMetadata && responseData.embeddingMetadata) {
    const metadataToUpdate = {
      embedding_id: responseData.embeddingMetadata.embedding_id || undefined,
      model: responseData.embeddingMetadata.model || undefined,
      dimensions: responseData.embeddingMetadata.dimensions || undefined,
      last_synced: responseData.embeddingMetadata.last_synced || undefined,
    }

    await payload.update({
      collection: 'knowledge-base-items',
      id: kbItemId,
      data: {
        embeddingMetadata: metadataToUpdate,
      },
      overrideAccess: true, // System operation
      context: { skipKBSync: true }, // Prevent infinite loop
    })

    payload.logger.info(`KB sync completed and metadata updated for ${kbItemId} (${action})`)

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
