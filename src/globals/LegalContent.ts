import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { anyone } from '../access/anyone'
import { defaultLexical } from '../fields/defaultLexical'

export const LegalContent: GlobalConfig = {
  slug: 'legal-content',
  access: {
    read: anyone,
    update: adminOrEditor,
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
}

