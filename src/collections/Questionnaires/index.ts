import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../../access/adminOrEditor'
import { anyone } from '../../access/anyone'

export const Questionnaires: CollectionConfig = {
  slug: 'questionnaires',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isCurrent', 'status', 'createdAt'],
  },
  access: {
    read: anyone,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Name identifier',
      },
    },
    {
      name: 'isCurrent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark this as the current active questionnaire',
      },
    },
    {
      name: 'instructionTitle',
      type: 'text',
      required: false,
      admin: {
        description: 'Title for the welcome instruction screen',
      },
    },
    {
      name: 'instructionItems',
      type: 'array',
      required: false,
      admin: {
        description: 'Numbered list items on the welcome instruction screen',
      },
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      required: false,
      admin: {
        description: 'Sections (each has a cover and steps with questions).',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          required: true,
          admin: { description: 'Section title (cover and heading)' },
        },
        {
          name: 'sectionSubtitle',
          type: 'text',
          required: false,
          admin: { description: 'Section subtitle' },
        },
        {
          name: 'colorSection',
          type: 'select',
          required: true,
          options: [
            { label: 'Purple', value: 'purple' },
            { label: 'Orange', value: 'orange' },
            { label: 'Green', value: 'green' },
            { label: 'Pink', value: 'pink' },
            { label: 'Turquoise', value: 'turquoise' },
          ],
          admin: {
            description:
              'Select the color of the section, this will be used for the section card background and progress bar.',
          },
        },
        {
          name: 'steps',
          type: 'array',
          required: true,
          admin: { description: 'Steps in this section' },
          fields: [
            {
              name: 'stepIdentifier',
              type: 'text',
              required: false,
              admin: { description: 'Step card title used for identification in the backend' },
            },
            {
              name: 'question',
              type: 'relationship',
              relationTo: 'questions',
              required: true,
              admin: { description: 'Questions in this step' },
            },
            {
              name: 'conditions',
              type: 'array',
              required: false,
              admin: {
                description: 'Conditional questions',
              },
              fields: [
                {
                  name: 'showWhenAnswerValue',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Answer value to show conditional question',
                  },
                },
                {
                  name: 'conditional question',
                  type: 'relationship',
                  relationTo: 'questions',
                  required: true,
                  admin: {
                    description: 'Question to show when answer matches',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'overline',
      type: 'text',
      required: false,
      admin: {
        description:
          'Deprecated: used for legacy welcome. Use instructionTitle + sections instead.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: false,
      admin: { description: 'Deprecated: use instructionTitle + sections instead.' },
    },
    {
      name: 'steps',
      type: 'array',
      required: false,
      admin: {
        description: 'Deprecated: use sections[].steps instead. Kept for migration.',
      },
      fields: [
        { name: 'stepTitle', type: 'text' },
        {
          name: 'questions',
          type: 'relationship',
          relationTo: 'questions',
          hasMany: true,
          required: true,
        },
      ],
    },
    {
      name: 'questions',
      type: 'relationship',
      relationTo: 'questions',
      hasMany: true,
      required: false,
      admin: {
        description: 'Deprecated: use sections[].steps[].questions instead. Kept for migration.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (data && data.isCurrent === true) {
          const existing = await req.payload.find({
            collection: 'questionnaires',
            where: {
              isCurrent: { equals: true },
              ...(operation === 'update' && originalDoc?.id
                ? { id: { not_equals: originalDoc.id } }
                : {}),
            },
            limit: 100,
            overrideAccess: false,
            req,
          })
          if (existing.docs.length > 0) {
            await Promise.all(
              existing.docs.map((doc) =>
                req.payload.update({
                  collection: 'questionnaires',
                  id: doc.id,
                  data: { isCurrent: false },
                  req,
                  overrideAccess: false,
                }),
              ),
            )
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
