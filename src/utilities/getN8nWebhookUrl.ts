import { getCachedGlobal } from './getGlobals'

import type { SiteSetting } from '@/payload-types'

/**
 * Get the full n8n webhook URL based on environment and SiteSettings configuration.
 * In development, uses full URL.
 * In production, prefers internal routing when explicitly configured, otherwise uses public URL.
 *
 * @param webhookPath - The webhook path (e.g., 'aiRecommendation', 'kbSync', or 'audioTranscribe')
 * @returns The full webhook URL
 */
export async function getN8nWebhookUrl(
  webhookPath: 'aiRecommendation' | 'kbSync' | 'audioTranscribe',
): Promise<string> {
  const siteSettings = (await getCachedGlobal('site-settings', 0)()) as SiteSetting

  const webhookPathValue =
    webhookPath === 'aiRecommendation'
      ? siteSettings?.n8nWebhooks?.aiRecommendation
      : webhookPath === 'kbSync'
        ? siteSettings?.n8nWebhooks?.kbSync
        : siteSettings?.n8nWebhooks?.audioTranscribe

  // Fallback to default paths if not configured in SiteSettings
  const defaultPath =
    webhookPath === 'aiRecommendation'
      ? '/webhook/ai/recommendation'
      : webhookPath === 'kbSync'
        ? '/webhook/kb/sync'
        : '/webhook/audio-to-transcribe'
  const configuredPath = webhookPathValue || defaultPath

  const isFullUrl =
    configuredPath.startsWith('http://') || configuredPath.startsWith('https://')

  // Extract path from full URL if provided (strip domain, keep query string)
  let pathOnly = configuredPath
  if (isFullUrl) {
    try {
      const url = new URL(configuredPath)
      pathOnly = `${url.pathname}${url.search}`
    } catch {
      // If URL parsing fails, use as-is
      pathOnly = configuredPath
    }
  }

  // Ensure path starts with /
  if (!pathOnly.startsWith('/')) {
    pathOnly = `/${pathOnly}`
  }

  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
    // Development: use full URL
    // If configured value was a full URL, use it; otherwise construct from domain
    if (isFullUrl) {
      return configuredPath
    }
    const n8nDomain = process.env.N8N_DOMAIN || 'https://n8n.adaptmap.de'
    return `${n8nDomain}${pathOnly}`
  }

  // Production:
  // - If N8N_INTERNAL_URL is provided, route through that internal host.
  // - Otherwise, use configured full URL directly when available.
  // - As last fallback, use N8N_DOMAIN.
  const n8nInternalUrl = process.env.N8N_INTERNAL_URL
  if (n8nInternalUrl) {
    return `${n8nInternalUrl}${pathOnly}`
  }

  if (isFullUrl) {
    return configuredPath
  }

  const n8nDomain = process.env.N8N_DOMAIN || 'https://n8n.adaptmap.de'
  return `${n8nDomain}${pathOnly}`
}
