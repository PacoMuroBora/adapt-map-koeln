import type { GlobalConfig } from 'payload'

import { adminOrEditor } from '../access/adminOrEditor'
import { anyone } from '../access/anyone'

export const UICopy: GlobalConfig = {
  slug: 'ui-copy',
  access: {
    read: anyone,
    update: adminOrEditor,
  },
  fields: [
    {
      name: 'questionnaire',
      type: 'group',
      admin: {
        description: 'Questionnaire flow button labels (used in questionnaire steps).',
      },
      fields: [
        {
          name: 'nextButton',
          type: 'text',
          defaultValue: 'Weiter',
        },
        {
          name: 'previousButton',
          type: 'text',
          defaultValue: 'Zurück',
        },
      ],
    },
  ],
}
