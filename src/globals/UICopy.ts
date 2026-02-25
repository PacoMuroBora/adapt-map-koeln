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
      name: 'landingPage',
      type: 'group',
      admin: {
        description: 'Landing page text',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'ctaButton',
          type: 'text',
          defaultValue: "Los geht's",
        },
      ],
    },
    {
      name: 'consent',
      type: 'group',
      admin: {
        description: 'Consent screen text',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'message',
          type: 'textarea',
          required: true,
        },
        {
          name: 'acceptButton',
          type: 'text',
          defaultValue: 'Akzeptieren',
        },
        {
          name: 'declineButton',
          type: 'text',
          defaultValue: 'Ablehnen',
        },
      ],
    },
    {
      name: 'questionnaire',
      type: 'group',
      admin: {
        description: 'Questionnaire flow text',
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
        {
          name: 'submitButton',
          type: 'text',
          defaultValue: 'Absenden',
        },
      ],
    },
    {
      name: 'results',
      type: 'group',
      admin: {
        description: 'Results page text',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          defaultValue: 'Deine Ergebnisse',
        },
        {
          name: 'aiRecommendationCta',
          type: 'text',
          defaultValue: 'KI-Empfehlung erhalten',
        },
      ],
    },
  ],
}
