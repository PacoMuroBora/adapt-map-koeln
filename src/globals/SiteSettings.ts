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
              name: 'defaultQuestionnaire',
              type: 'relationship',
              relationTo: 'questionnaires',
              admin: {
                description: 'Default questionnaire to use if no current questionnaire is set',
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
                },
              ],
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
              ],
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
