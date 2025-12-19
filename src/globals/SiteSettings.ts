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
  ],
}

