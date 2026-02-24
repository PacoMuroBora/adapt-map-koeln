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
          name: 'colorCardProgress',
          type: 'text',
          required: false,
          admin: {
            description: 'Hex color for section card shape and progress bar (e.g. #6366f1)',
          },
        },
        {
          name: 'colorCardBg',
          type: 'text',
          required: false,
          admin: {
            description: 'Hex color for card background (e.g. #e0e7ff)',
          },
        },
        {
          name: 'steps',
          type: 'array',
          required: true,
          admin: { description: 'Steps in this section' },
          fields: [
            {
              name: 'stepTitle',
              type: 'text',
              required: false,
              admin: { description: 'Step card title' },
            },
            {
              name: 'questions',
              type: 'relationship',
              relationTo: 'questions',
              hasMany: true,
              required: true,
              admin: { description: 'Questions in this step' },
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
        description: 'Deprecated: used for legacy welcome. Use instructionTitle + sections instead.',
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
        { name: 'stepDescription', type: 'textarea' },
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
