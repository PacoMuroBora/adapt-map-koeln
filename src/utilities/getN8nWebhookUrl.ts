import { getCachedGlobal } from './getGlobals'

import type { SiteSetting } from '@/payload-types'

/**
 * Get the full n8n webhook URL based on environment and SiteSettings configuration.
 * In development, uses full URL. In production, uses path only for internal routing.
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

  if (!webhookPathValue) {
    throw new Error(`n8n webhook URL not configured for ${webhookPath}`)
  }

  // If the path already includes a full URL (starts with http:// or https://), use it as-is
  if (webhookPathValue.startsWith('http://') || webhookPathValue.startsWith('https://')) {
    return webhookPathValue
  }

  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
    // Development: use full URL with domain
    const n8nDomain = process.env.N8N_DOMAIN || 'https://n8n.adaptmap.de'
    return `${n8nDomain}${webhookPathValue.startsWith('/') ? '' : '/'}${webhookPathValue}`
  }

  // Production: use path with default local port for internal routing
  // If N8N_INTERNAL_URL is set, use it; otherwise use localhost with default port
  const n8nInternalUrl =
    process.env.N8N_INTERNAL_URL || process.env.N8N_DOMAIN || 'http://localhost:5678'
  return `${n8nInternalUrl}${webhookPathValue.startsWith('/') ? '' : '/'}${webhookPathValue}`
}

