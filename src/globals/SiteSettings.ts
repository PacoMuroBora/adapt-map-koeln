import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { anyone } from '../access/anyone'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: anyone,
    update: adminOrEditor,
  },
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
}
