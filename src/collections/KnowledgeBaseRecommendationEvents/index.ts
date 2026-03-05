import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../../access/adminOrEditor'

export const KnowledgeBaseRecommendationEvents: CollectionConfig = {
  slug: 'knowledge-base-recommendation-events',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['kbItem', 'submission', 'source', 'recommendedAt'],
  },
  access: {
    read: adminOrEditor,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'kbItem',
      type: 'relationship',
      relationTo: 'knowledge-base-items',
      required: true,
      index: true,
    },
    {
      name: 'submission',
      type: 'relationship',
      relationTo: 'submissions',
      required: true,
      index: true,
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        {
          label: 'AI Recommendation',
          value: 'ai-recommendation',
        },
      ],
      defaultValue: 'ai-recommendation',
      index: true,
    },
    {
      name: 'recommendedAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'theme',
      type: 'text',
      admin: {
        description: 'Snapshot of KB theme at recommendation time',
      },
      index: true,
    },
    {
      name: 'solution_type',
      type: 'text',
      admin: {
        description: 'Snapshot of KB solution type at recommendation time',
      },
      index: true,
    },
    {
      name: 'postal_code',
      type: 'text',
      admin: {
        description: 'Snapshot of submission postal code at recommendation time',
      },
      index: true,
    },
    {
      name: 'categories',
      type: 'array',
      admin: {
        description: 'Snapshot of KB categories at recommendation time',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}

