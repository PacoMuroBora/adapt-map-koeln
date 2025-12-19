import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../../access/adminOrEditor'
import { anyone } from '../../access/anyone'

export const Questionnaires: CollectionConfig = {
  slug: 'questionnaires',
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'isCurrent', 'status', 'createdAt'],
  },
  access: {
    read: anyone,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'version',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Version identifier (e.g., "v1.0", "2024-01")',
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
      name: 'questions',
      type: 'relationship',
      relationTo: 'questions',
      hasMany: true,
      required: true,
      minRows: 10,
      maxRows: 10,
      admin: {
        description: 'Exactly 10 questions must be selected',
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
    beforeValidate: [
      async ({ data, operation }) => {
        if ((operation === 'create' || operation === 'update') && data) {
          // Ensure questions is an array
          const questions = Array.isArray(data.questions) ? data.questions : []
          
          if (questions.length !== 10) {
            throw new Error('Questionnaire must have exactly 10 questions')
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        // If setting isCurrent to true, unset all other questionnaires
        if (data && data.isCurrent === true) {
          const whereClause: any = {
            isCurrent: { equals: true },
          }
          
          // Only exclude current document on update
          if (operation === 'update' && originalDoc?.id) {
            whereClause.id = { not_equals: originalDoc.id }
          }

          const existing = await req.payload.find({
            collection: 'questionnaires',
            where: whereClause,
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
                })
              )
            )
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}

