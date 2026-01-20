import { getPayload } from 'payload'
import type { Payload } from 'payload'
import configPromise from '@payload-config'

let cachedPayload: Payload | null = null
let initPromise: Promise<Payload> | null = null

/**
 * Get a cached Payload instance to prevent connection pool exhaustion in serverless environments.
 * 
 * This function caches the Payload instance at module level, ensuring all API routes
 * and utilities share the same connection pool instead of creating new ones.
 * 
 * @returns A Promise that resolves to the Payload instance
 */
export async function getPayloadClient(): Promise<Payload> {
  // If we already have a cached instance, return it
  if (cachedPayload) {
    return cachedPayload
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise
  }

  // Start initialization
  initPromise = (async () => {
    try {
      const payload = await getPayload({ config: configPromise })
      cachedPayload = payload
      return payload
    } finally {
      // Clear initPromise once done (even on error)
      initPromise = null
    }
  })()

  return initPromise
}
