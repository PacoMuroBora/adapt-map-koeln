import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { anyone } from '../access/anyone'
import { defaultLexical } from '../fields/defaultLexical'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: anyone,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'excelUpload',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/ExcelUpload',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              admin: {
                description: 'Site name/title',
              },
            },
            {
              name: 'siteDescription',
              type: 'textarea',
              admin: {
                description: 'Site description',
              },
            },
            {
              name: 'contactEmail',
              type: 'email',
              admin: {
                description: 'Main contact email',
              },
            },
            {
              name: 'mapCenter',
              type: 'group',
              admin: {
                description: 'Default map center coordinates',
              },
              fields: [
                {
                  name: 'lat',
                  type: 'number',
                  defaultValue: 50.9375, // Cologne coordinates
                },
                {
                  name: 'lng',
                  type: 'number',
                  defaultValue: 6.9603,
                },
                {
                  name: 'zoom',
                  type: 'number',
                  defaultValue: 10,
                  admin: {
                    description:
                      'Map zoom level (1-20). Higher values zoom closer (e.g., 10 = city level, 15 = street level).',
                  },
                },
              ],
            },
            {
              name: 'heatmapTileSize',
              type: 'number',
              defaultValue: 500,
              min: 50,
              max: 5000,
              required: true,
              admin: {
                description:
                  'Size of heatmap grid tiles in meters (default: 500m). Smaller values create finer grids.',
                step: 50,
              },
            },
            {
              name: 'heatmapTileOpacity',
              type: 'number',
              defaultValue: 0.35,
              min: 0,
              max: 1,
              required: true,
              admin: {
                description:
                  'Opacity of heatmap tiles (0-1). Lower values make tiles more transparent. Default: 0.35',
                step: 0.01,
              },
            },
            {
              name: 'n8nWebhooks',
              type: 'group',
              admin: {
                description:
                  'n8n webhook URLs. In development, use full URL (https://n8n.adaptmap.de/...). In production, use path only for internal routing (/webhook/...).',
              },
              fields: [
                {
                  name: 'aiRecommendation',
                  type: 'text',
                  required: true,
                  admin: {
                    description:
                      'n8n webhook URL for AI recommendation generation. Dev: https://n8n.adaptmap.de/webhook/ai/recommendation | Prod: /webhook/ai/recommendation',
                    placeholder: '/webhook/ai/recommendation',
                  },
                  defaultValue: '/webhook/ai/recommendation',
                },
                {
                  name: 'kbSync',
                  type: 'text',
                  required: true,
                  admin: {
                    description:
                      'n8n webhook URL for knowledge base synchronization. Dev: https://n8n.adaptmap.de/webhook/kb/sync | Prod: /webhook/kb/sync',
                    placeholder: '/webhook/kb/sync',
                  },
                  defaultValue: '/webhook/kb/sync',
                },
                {
                  name: 'audioTranscribe',
                  type: 'text',
                  required: true,
                  admin: {
                    description:
                      'n8n webhook URL for audio-to-text transcription. Dev: https://n8n.adaptmap.de/webhook/audio-to-transcribe | Prod: /webhook/audio-to-transcribe',
                    placeholder: '/webhook/audio-to-transcribe',
                  },
                  defaultValue: '/webhook/audio-to-transcribe',
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              admin: {
                description: 'Default meta title for the site (used in <title> tag and OpenGraph)',
                placeholder: 'AdaptMap Köln - Accessibility Mapping',
              },
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              admin: {
                description:
                  'Default meta description for the site (used in <meta name="description"> and OpenGraph)',
                placeholder: 'Discover accessible locations in Cologne with AdaptMap Köln',
              },
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Default OpenGraph image (recommended: 1200x630px)',
              },
            },
            {
              name: 'twitterHandle',
              type: 'text',
              admin: {
                description: 'Twitter/X handle (without @)',
                placeholder: 'adaptmapkoeln',
              },
            },
            {
              name: 'keywords',
              type: 'text',
              admin: {
                description: 'Comma-separated keywords for SEO (optional)',
                placeholder: 'accessibility, cologne, mapping, inclusive design',
              },
            },
          ],
        },
        {
          label: 'Legal & Cookies',
          fields: [
            {
              name: 'legalContent',
              type: 'group',
              admin: {
                description: 'Legal content pages (Impressum, Privacy Policy, Terms & Conditions)',
              },
              fields: [
                {
                  name: 'impressum',
                  type: 'richText',
                  required: true,
                  editor: defaultLexical,
                  admin: {
                    description: 'Impressum / Legal notice',
                  },
                },
                {
                  name: 'privacyPolicy',
                  type: 'richText',
                  required: true,
                  editor: defaultLexical,
                  admin: {
                    description: 'Privacy policy / Datenschutzerklärung',
                  },
                },
                {
                  name: 'termsAndConditions',
                  type: 'richText',
                  required: true,
                  editor: defaultLexical,
                  admin: {
                    description: 'Terms and conditions / AGB',
                  },
                },
              ],
            },
            {
              name: 'cookieBanner',
              type: 'group',
              admin: {
                description: 'Cookie consent banner configuration',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Cookie banner title',
                  },
                  defaultValue: 'Cookies & Datenschutz',
                },
                {
                  name: 'message',
                  type: 'textarea',
                  required: true,
                  admin: {
                    description: 'Cookie banner message text',
                  },
                  defaultValue:
                    'Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten.',
                },
                {
                  name: 'acceptAllText',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Accept all cookies button text',
                  },
                  defaultValue: 'Alle akzeptieren',
                },
                {
                  name: 'acceptNecessaryText',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Accept necessary cookies only button text',
                  },
                  defaultValue: 'Nur notwendige',
                },
                {
                  name: 'privacyLinkText',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Privacy policy link text',
                  },
                  defaultValue: 'Datenschutzerklärung',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
