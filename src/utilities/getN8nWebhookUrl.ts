import { getCachedGlobal } from './getGlobals'

import type { SiteSetting } from '@/payload-types'

/**
 * Get the full n8n webhook URL based on environment and SiteSettings configuration.
 * In development, uses full URL. In production, strips domain and uses internal routing.
 *
 * @param webhookPath - The webhook path (e.g., 'aiRecommendation' or 'kbSync')
 * @returns The full webhook URL
 */
export async function getN8nWebhookUrl(
  webhookPath: 'aiRecommendation' | 'kbSync',
): Promise<string> {
  const siteSettings = (await getCachedGlobal('site-settings', 0)()) as SiteSetting

  const webhookPathValue =
    webhookPath === 'aiRecommendation'
      ? siteSettings?.n8nWebhooks?.aiRecommendation
      : siteSettings?.n8nWebhooks?.kbSync

  // Fallback to default paths if not configured in SiteSettings
  const defaultPath =
    webhookPath === 'aiRecommendation' ? '/webhook/ai/recommendation' : '/webhook/kb/sync'
  let configuredPath = webhookPathValue || defaultPath

  // Extract path from full URL if provided (strip domain)
  let pathOnly = configuredPath
  if (configuredPath.startsWith('http://') || configuredPath.startsWith('https://')) {
    try {
      const url = new URL(configuredPath)
      pathOnly = url.pathname
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
    if (configuredPath.startsWith('http://') || configuredPath.startsWith('https://')) {
      return configuredPath
    }
    const n8nDomain = process.env.N8N_DOMAIN || 'https://n8n.adaptmap.de'
    return `${n8nDomain}${pathOnly}`
  }

  // Production: strip domain and use internal routing
  const n8nInternalUrl =
    process.env.N8N_INTERNAL_URL || process.env.N8N_DOMAIN || 'http://localhost:5678'
  return `${n8nInternalUrl}${pathOnly}`
}
