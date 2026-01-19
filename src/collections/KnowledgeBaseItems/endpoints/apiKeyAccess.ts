import type { Endpoint } from 'payload'
import { APIError } from 'payload'

import { validateApiKey } from '../../../utilities/validateApiKey'

/**
 * Custom endpoint to fetch KB item with API key authentication
 * This allows n8n to access KB items without JWT tokens
 */
export const getKbItemWithApiKey: Endpoint = {
  path: '/:id/api-key',
  method: 'get',
  handler: async (req) => {
    // Validate API key
    validateApiKey(req)

    const id = req.routeParams?.id as string | undefined

    if (!id) {
      throw new APIError('Missing KB item ID', 400)
    }

    // Fetch KB item using Local API with overrideAccess (system operation)
    const kbItem = await req.payload.findByID({
      collection: 'knowledge-base-items',
      id,
      depth: 2,
      overrideAccess: true, // System operation - API key authenticated
    })

    if (!kbItem) {
      throw new APIError('Knowledge base item not found', 404)
    }

    return Response.json(kbItem)
  },
}

/**
 * Custom endpoint to update KB item embedding metadata with API key authentication
 */
export const updateKbItemMetadataWithApiKey: Endpoint = {
  path: '/:id/embedding-metadata',
  method: 'patch',
  handler: async (req) => {
    // Validate API key
    validateApiKey(req)

    const id = req.routeParams?.id as string | undefined

    if (!id) {
      throw new APIError('Missing KB item ID', 400)
    }

    // Parse request body
    let body: any
    try {
      // req extends Request which has json() method
      body = await (req as Request).json()
    } catch (error) {
      throw new APIError('Invalid JSON in request body', 400)
    }

    if (!body || typeof body !== 'object') {
      throw new APIError('Invalid request body', 400)
    }

    if (!body.embeddingMetadata) {
      throw new APIError('Missing embeddingMetadata in request body', 400)
    }

    // Extract only the embeddingMetadata fields we want to update
    const embeddingMetadata = {
      embedding_id: body.embeddingMetadata.embedding_id || undefined,
      model: body.embeddingMetadata.model || undefined,
      dimensions: body.embeddingMetadata.dimensions || undefined,
      last_synced: body.embeddingMetadata.last_synced || undefined,
    }

    // Remove undefined values
    Object.keys(embeddingMetadata).forEach((key) => {
      if (embeddingMetadata[key as keyof typeof embeddingMetadata] === undefined) {
        delete embeddingMetadata[key as keyof typeof embeddingMetadata]
      }
    })

    // Update KB item using Local API with overrideAccess (system operation)
    // Only pass embeddingMetadata to ensure no other fields are accidentally updated
    const updated = await req.payload.update({
      collection: 'knowledge-base-items',
      id,
      data: {
        embeddingMetadata,
      },
      overrideAccess: true, // System operation - API key authenticated
    })

    // Return 200 status code explicitly for n8n workflow success detection
    return Response.json(
      {
        success: true,
        message: 'Embedding metadata updated successfully',
        data: updated,
      },
      { status: 200 },
    )
  },
}
