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

