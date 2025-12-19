import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/adminOnly'
import { anyone } from '../../access/anyone'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['problem_index', 'questionnaireVersion', 'createdAt'],
  },
  access: {
    read: adminOnly,
    create: anyone,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          defaultValue: () => new Date(),
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'user_agent',
          type: 'text',
          admin: {
            description: 'User agent string from browser',
          },
        },
        {
          name: 'consent_version',
          type: 'text',
          admin: {
            description: 'Version of consent form accepted',
          },
        },
      ],
    },
    {
      name: 'location',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'lat',
          type: 'number',
          required: true,
          admin: {
            description: 'Latitude',
          },
        },
        {
          name: 'lng',
          type: 'number',
          required: true,
          admin: {
            description: 'Longitude',
          },
        },
        {
          name: 'postal_code',
          type: 'text',
          required: true,
          index: true,
          admin: {
            description: 'Postal code (PLZ)',
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City name',
          },
        },
      ],
    },
    {
      name: 'personalFields',
      type: 'group',
      admin: {
        description: 'Optional personal information',
      },
      fields: [
        {
          name: 'age',
          type: 'number',
          admin: {
            description: 'Age range or specific age',
          },
        },
        {
          name: 'gender',
          type: 'select',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Diverse', value: 'diverse' },
            { label: 'Prefer not to say', value: 'prefer_not_to_say' },
          ],
        },
        {
          name: 'householdSize',
          type: 'number',
          admin: {
            description: 'Number of people in household',
          },
        },
      ],
    },
    {
      name: 'questionnaireVersion',
      type: 'relationship',
      relationTo: 'questionnaires',
      required: true,
      index: true,
    },
    {
      name: 'answers',
      type: 'json',
      required: true,
      admin: {
        description: 'Answers keyed by question key',
      },
    },
    {
      name: 'problem_index',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      index: true,
      admin: {
        description: 'Calculated problem index (0-100)',
        readOnly: true,
      },
    },
    {
      name: 'sub_scores',
      type: 'json',
      admin: {
        description: 'Sub-scores by category',
        readOnly: true,
      },
    },
    {
      name: 'user_text',
      type: 'textarea',
      admin: {
        description: 'Free text input from user',
      },
    },
    {
      name: 'aiFields',
      type: 'group',
      admin: {
        description: 'AI-generated recommendations',
      },
      fields: [
        {
          name: 'ai_summary_de',
          type: 'textarea',
          admin: {
            description: 'AI-generated summary in German',
          },
        },
        {
          name: 'ai_recommendations_de',
          type: 'json',
          admin: {
            description: 'AI-generated recommendations array',
          },
        },
        {
          name: 'ai_referenced_kb_ids',
          type: 'array',
          admin: {
            description: 'IDs of referenced knowledge base items',
          },
          fields: [
            {
              name: 'kb_id',
              type: 'text',
            },
          ],
        },
        {
          name: 'ai_model_metadata',
          type: 'json',
          admin: {
            description: 'Metadata about the AI model used',
          },
        },
        {
          name: 'ai_generated_at',
          type: 'date',
          admin: {
            description: 'When AI recommendations were generated',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
  timestamps: true,
}

