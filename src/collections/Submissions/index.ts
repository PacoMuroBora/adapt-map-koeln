import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/adminOnly'
import { anyone } from '../../access/anyone'
import {
  revalidateHeatmapAfterChange,
  revalidateHeatmapAfterDelete,
} from './hooks/revalidateHeatmap'

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
        {
          name: 'street',
          type: 'text',
          admin: {
            description: 'Street name (with or without house number)',
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
      type: 'text',
      required: true,
      defaultValue: 'v1.0',
      index: true,
      admin: {
        description: 'Questionnaire version identifier',
      },
    },
    {
      name: 'heatFrequency',
      type: 'select',
      required: true,
      options: [
        { label: '1 – 3 Tage', value: '1-3' },
        { label: '4 – 10 Tage', value: '4-10' },
        { label: '11 – 20 Tage', value: '11-20' },
        { label: '21 – 40 Tage', value: '21-40' },
        { label: '> 40 Tage', value: '>40' },
      ],
      admin: {
        description: 'Frequency of heat days per year',
      },
    },
    {
      name: 'heatIntensity',
      type: 'number',
      required: true,
      min: 0,
      max: 9,
      admin: {
        description: 'Intensity of heat (0-9 slider value)',
      },
    },
    {
      name: 'livingSituation',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'housingType',
          type: 'select',
          required: true,
          options: [
            { label: 'Wohnung', value: 'apartment' },
            { label: 'Haus', value: 'house' },
          ],
          admin: {
            description: 'Apartment or house',
          },
        },
        {
          name: 'greenNeighborhood',
          type: 'select',
          required: true,
          options: [
            { label: 'Ja', value: 'yes' },
            { label: 'Nein', value: 'no' },
            { label: 'Weiß nicht', value: 'unsure' },
          ],
          admin: {
            description: 'Is the neighborhood open and green?',
          },
        },
        {
          name: 'cityArea',
          type: 'select',
          required: true,
          options: [
            { label: 'Innenstadt', value: 'inner' },
            { label: 'Äußerer Bereich', value: 'outer' },
          ],
          admin: {
            description: 'Inner city or outer area',
          },
        },
      ],
    },
    {
      name: 'climateAdaptationKnowledge',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'knowsTerm',
          type: 'checkbox',
          required: true,
          admin: {
            description: 'Knows the term "Klimawandelanpassung"',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Optional description of what they know',
          },
        },
      ],
    },
    {
      name: 'desiredChanges',
      type: 'array',
      admin: {
        description: 'Selected icons for desired changes (greening, water, shadow, etc.)',
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [
            { label: 'Begrünung', value: 'greening' },
            { label: 'Wasser', value: 'water' },
            { label: 'Schatten', value: 'shadow' },
            { label: 'Verschattung', value: 'shading' },
            { label: 'Kühlung', value: 'cooling' },
            { label: 'Dachbegrünung', value: 'roof_greening' },
            { label: 'Fassadenbegrünung', value: 'facade_greening' },
            { label: 'Wasserspender', value: 'water_fountain' },
          ],
        },
      ],
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
  hooks: {
    afterChange: [revalidateHeatmapAfterChange],
    afterDelete: [revalidateHeatmapAfterDelete],
  },
  timestamps: true,
}
