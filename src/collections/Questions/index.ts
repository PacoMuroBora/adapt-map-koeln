import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/adminOnly'
import { adminOrEditor } from '../../access/adminOrEditor'
import { anyone } from '../../access/anyone'

export const Questions: CollectionConfig = {
  slug: 'questions',
  admin: {
    useAsTitle: 'title_de',
    defaultColumns: ['title_de', 'type', 'category', 'required'],
  },
  access: {
    read: anyone,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier for the question (e.g., "q1", "heat_comfort")',
      },
    },
    {
      name: 'title_de',
      type: 'text',
      required: true,
      admin: {
        description: 'Question title in German',
      },
    },
    {
      name: 'description_de',
      type: 'textarea',
      admin: {
        description: 'Optional description or help text in German',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Single Choice', value: 'singleChoice' },
        { label: 'Multiple Choice', value: 'multiChoice' },
        { label: 'Dropdown', value: 'dropdown' },
        { label: 'Slider', value: 'slider' },
        { label: 'Slider (horizontal range)', value: 'sliderHorizontalRange' },
        { label: 'Slider (vertical)', value: 'sliderVertical' },
        { label: 'Number', value: 'number' },
        { label: 'Address', value: 'address' },
        { label: 'PLZ', value: 'plz' },
        { label: 'Location_GPS', value: 'location_GPS' },
        { label: 'Icon Selection', value: 'iconSelection' },
        { label: 'Group', value: 'group' },
        { label: 'Textarea', value: 'textarea' },
        { label: 'Consent', value: 'consent' },
      ],
      admin: {
        description: 'Type of question input',
      },
    },
    {
      name: 'options',
      type: 'array',
      admin: {
        condition: (data) =>
          data.type === 'singleChoice' || data.type === 'multiChoice' || data.type === 'dropdown',
        description: 'Available options for choice/dropdown questions',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'score',
          type: 'number',
          admin: {
            description: 'Score value for this option (used in adminScoring)',
          },
        },
      ],
    },
    {
      name: 'numberConfig',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'number',
        description: 'Configuration for number questions',
      },
      fields: [
        {
          name: 'min',
          type: 'number',
          admin: { description: 'Minimum value' },
        },
        {
          name: 'max',
          type: 'number',
          admin: { description: 'Maximum value' },
        },
        {
          name: 'placeholder',
          type: 'text',
          admin: { description: 'Placeholder text' },
        },
        {
          name: 'unit',
          type: 'text',
          admin: { description: 'Unit label (e.g. "Jahre", "Personen")' },
        },
      ],
    },
    {
      name: 'textareaConfig',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'textarea',
        description: 'Configuration for textarea questions',
      },
      fields: [
        {
          name: 'maxLength',
          type: 'number',
          defaultValue: 2000,
          admin: { description: 'Max character count' },
        },
        {
          name: 'rows',
          type: 'number',
          defaultValue: 4,
          admin: { description: 'Visible rows' },
        },
      ],
    },
    {
      name: 'consentConfig',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'consent',
        description: 'Configuration for consent checkbox',
      },
      fields: [
        {
          name: 'consentText',
          type: 'textarea',
          required: true,
          admin: { description: 'Legal text shown next to the checkbox' },
        },
        {
          name: 'consentVersion',
          type: 'text',
          admin: { description: 'Version identifier for this consent' },
        },
      ],
    },
    {
      name: 'sliderConfig',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'slider' || data.type === 'sliderHorizontalRange',
        description: 'Configuration for slider questions',
      },
      fields: [
        {
          name: 'min',
          type: 'number',
          required: true,
          defaultValue: 0,
        },
        {
          name: 'max',
          type: 'number',
          required: true,
          defaultValue: 100,
        },
        {
          name: 'step',
          type: 'number',
          required: true,
          defaultValue: 1,
        },
        {
          name: 'unit',
          type: 'text',
          admin: {
            description: 'Unit label (e.g., "°C", "%")',
          },
        },
      ],
    },
    {
      name: 'sliderVerticalConfig',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'sliderVertical',
        description: 'Configuration for vertical slider (top/bottom labels, no units)',
      },
      fields: [
        { name: 'min', type: 'number', required: true, defaultValue: 0 },
        { name: 'max', type: 'number', required: true, defaultValue: 10 },
        { name: 'step', type: 'number', required: true, defaultValue: 1 },
        {
          name: 'labelTop',
          type: 'text',
          required: true,
          admin: { description: 'Label above the slider (e.g. "viel zu heiß")' },
        },
        {
          name: 'labelBottom',
          type: 'text',
          required: true,
          admin: { description: 'Label below the slider (e.g. "angenehm")' },
        },
      ],
    },
    {
      name: 'required',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this question must be answered',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description:
          'Category for grouping questions (e.g., "comfort", "health", "infrastructure")',
      },
    },
    {
      name: 'editorFields',
      type: 'group',
      admin: {
        description: 'Fields editable by editors (not admins only)',
      },
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          const roles = (user as any)?.roles
          return roles === 'admin' || roles === 'editor'
        },
      },
      fields: [
        {
          name: 'displayOrder',
          type: 'number',
          admin: {
            description: 'Order in which this question appears',
          },
        },
        {
          name: 'helpText',
          type: 'textarea',
          admin: {
            description: 'Additional help text for users',
          },
        },
      ],
    },
    {
      name: 'adminScoring',
      type: 'group',
      admin: {
        description: 'Scoring configuration (admin only)',
      },
      access: {
        read: ({ req: { user } }) => {
          const roles = (user as any)?.roles
          return roles === 'admin'
        },
        update: ({ req: { user } }) => {
          const roles = (user as any)?.roles
          return roles === 'admin'
        },
      },
      fields: [
        {
          name: 'weight',
          type: 'number',
          required: true,
          defaultValue: 1,
          admin: {
            description: 'Weight multiplier for this question in problem index calculation',
          },
        },
        {
          name: 'optionScores',
          type: 'array',
          admin: {
            condition: (data, siblingData) =>
              siblingData.type === 'singleChoice' ||
              siblingData.type === 'multiChoice' ||
              siblingData.type === 'dropdown',
            description: 'Score mappings for each option',
          },
          fields: [
            {
              name: 'optionValue',
              type: 'text',
              required: true,
            },
            {
              name: 'score',
              type: 'number',
              required: true,
              admin: {
                description: 'Score value (0-100) for this option',
              },
            },
          ],
        },
        {
          name: 'sliderMapping',
          type: 'group',
          admin: {
            condition: (data, siblingData) =>
              siblingData.type === 'slider' || siblingData.type === 'sliderHorizontalRange',
            description: 'How to map slider values to scores',
          },
          fields: [
            {
              name: 'normalization',
              type: 'select',
              options: [
                { label: 'Linear', value: 'linear' },
                { label: 'Logarithmic', value: 'logarithmic' },
                { label: 'Custom Function', value: 'custom' },
              ],
              defaultValue: 'linear',
            },
            {
              name: 'minScore',
              type: 'number',
              defaultValue: 0,
              admin: {
                description: 'Score when slider is at minimum',
              },
            },
            {
              name: 'maxScore',
              type: 'number',
              defaultValue: 100,
              admin: {
                description: 'Score when slider is at maximum',
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
