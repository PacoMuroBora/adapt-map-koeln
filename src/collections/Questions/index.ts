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
        { label: 'Single Choice with Icon', value: 'singleChoiceWithIcon' },
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
        { label: 'Text', value: 'text' },
        { label: 'Consent', value: 'consent' },
        { label: 'Age Wheel', value: 'ageWheel' },
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
          data.type === 'singleChoice' ||
          data.type === 'singleChoiceWithIcon' ||
          data.type === 'multiChoice' ||
          data.type === 'dropdown',
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
      name: 'ageWheelConfig',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'ageWheel',
        description: 'Configuration for age wheel picker (min/max age)',
      },
      fields: [
        { name: 'min', type: 'number', required: true, defaultValue: 0 },
        { name: 'max', type: 'number', required: true, defaultValue: 120 },
        { name: 'startValue', type: 'number', required: true, defaultValue: 28 },
      ],
    },
    {
      name: 'submissionBinding',
      type: 'group',
      admin: {
        description:
          'Maps this question answer to a specific submission field. If not set, answer is logged but not persisted.',
      },
      fields: [
        {
          name: 'mode',
          type: 'select',
          required: true,
          options: [
            { label: 'Submission Field', value: 'explicitField' },
            { label: 'Custom Key (not persisted)', value: 'customKey' },
          ],
          defaultValue: 'explicitField',
          admin: {
            description:
              '"Submission Field" writes directly to a typed Submissions field. "Custom Key" is for navigation/meta answers that are only logged.',
          },
        },
        {
          name: 'fieldPath',
          type: 'select',
          validate: (value: unknown, { siblingData }: { siblingData: any }) => {
            if (siblingData?.mode === 'explicitField' && !value) {
              return 'Field path is required when mode is "Submission Field"'
            }
            return true
          },
          options: [
            { label: 'Hitzetage pro Jahr (heatFrequency)', value: 'heatFrequency' },
            { label: 'Hitze-Intensität (heatIntensity)', value: 'heatIntensity' },
            { label: 'Freitext (user_text)', value: 'user_text' },
            { label: 'Standort – Adresse komplett (location)', value: 'location' },
            { label: 'PLZ (location.postal_code)', value: 'location.postal_code' },
            { label: 'Stadt (location.city)', value: 'location.city' },
            { label: 'Straße (location.street)', value: 'location.street' },
            { label: 'Breitengrad (location.lat)', value: 'location.lat' },
            { label: 'Längengrad (location.lng)', value: 'location.lng' },
            { label: 'Alter (personalFields.age)', value: 'personalFields.age' },
            { label: 'Geschlecht (personalFields.gender)', value: 'personalFields.gender' },
            {
              label: 'Haushaltsgröße (personalFields.householdSize)',
              value: 'personalFields.householdSize',
            },
            {
              label: 'Wohnform (livingSituation.housingType)',
              value: 'livingSituation.housingType',
            },
            {
              label: 'Grünes Umfeld (livingSituation.greenNeighborhood)',
              value: 'livingSituation.greenNeighborhood',
            },
            { label: 'Stadtlage (livingSituation.cityArea)', value: 'livingSituation.cityArea' },
            {
              label: 'Begriff bekannt (climateAdaptationKnowledge.knowsTerm)',
              value: 'climateAdaptationKnowledge.knowsTerm',
            },
            {
              label: 'Klima-Beschreibung (climateAdaptationKnowledge.description)',
              value: 'climateAdaptationKnowledge.description',
            },
            { label: 'Einwilligung (consent)', value: 'consent' },
            { label: 'Gewünschte Veränderungen (desiredChanges)', value: 'desiredChanges' },
          ],
          admin: {
            condition: (_data, siblingData) => siblingData?.mode === 'explicitField',
            description: 'Target field path in the Submissions collection',
          },
        },
        {
          name: 'customKey',
          type: 'text',
          validate: (value: unknown, { siblingData }: { siblingData: any }) => {
            if (siblingData?.mode === 'customKey' && !value) {
              return 'Custom key is required when mode is "Custom Key"'
            }
            return true
          },
          admin: {
            condition: (_data, siblingData) => siblingData?.mode === 'customKey',
            description:
              'Custom identifier for this answer. Not persisted in submission – used for logging/debugging only.',
          },
        },
      ],
    },
    {
      name: 'required',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Whether this question must be answered. If yes button says "Weiter", if no button says "Überspringen".',
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
