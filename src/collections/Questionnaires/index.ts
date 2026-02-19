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
      name: 'overline',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Use for eg: "Teil 1", "Teil 2", etc.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
      index: true,
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
      admin: {
        description: 'Select questions for this questionnaire',
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
