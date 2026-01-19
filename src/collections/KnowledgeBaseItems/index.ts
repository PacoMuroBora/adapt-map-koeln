import type { CollectionConfig, TextFieldSingleValidation } from 'payload'

import { adminOrEditor } from '../../access/adminOrEditor'
import { anyone } from '../../access/anyone'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import {
  deleteKnowledgeBaseFromVectorDB,
  syncKnowledgeBaseToVectorDB,
} from './hooks/syncToVectorDB'
import { getKbItemWithApiKey, updateKbItemMetadataWithApiKey } from './endpoints/apiKeyAccess'
import { categoryOptions } from './categoryOptions'
import { themeOptions } from './themeOptions'

export const KnowledgeBaseItems: CollectionConfig = {
  slug: 'knowledge-base-items',
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'theme', 'solution_type', 'status', 'createdAt'],
  },
  access: {
    read: authenticatedOrPublished,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'companyOrTip',
      type: 'group',
      admin: {
        description:
          'Enter either a company name or a tip. If company is left blank, this entry is treated as a generic universal tip.',
      },
      fields: [
        {
          name: 'company',
          type: 'text',
          index: true,
          admin: {
            description: 'The name of the company. Leave blank if this is a tip.',
          },
        },
        {
          name: 'tip',
          type: 'textarea',
          admin: {
            description: 'Generic universal tip content. Used when company is left blank.',
          },
        },
      ],
    },
    {
      name: 'displayTitle',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
        description: 'Auto-generated title from company or tip',
      },
    },
    {
      name: 'theme',
      type: 'select',
      options: themeOptions,
      index: true,
      admin: {
        description: 'The main thematic focus of the solution',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'A detailed description of the technology or solution',
      },
    },
    {
      name: 'problems_solved',
      type: 'textarea',
      admin: {
        description: 'The problems that are solved by the solution',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: "The company's location",
      },
    },
    {
      name: 'additional_context',
      type: 'number',
      admin: {
        description: 'Contextual number from the source data',
      },
    },
    {
      name: 'solution_type',
      type: 'text',
      index: true,
      admin: {
        description: 'The type of solution (e.g., "startup")',
      },
    },
    {
      name: 'link',
      type: 'text',
      admin: {
        description: 'Link to the company or product website',
      },
      validate: ((value) => {
        if (value && typeof value === 'string' && value.length > 0) {
          try {
            new URL(value)
            return true
          } catch {
            return 'Please enter a valid URL'
          }
        }
        return true
      }) as TextFieldSingleValidation,
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      options: categoryOptions,
      admin: {
        description: 'The categories the solution belongs to (e.g., "Hitzeschutz", "Gebaeude")',
      },
    },
    {
      name: 'use_case',
      type: 'text',
      admin: {
        description: 'The primary use case for the solution',
      },
    },
    {
      name: 'applicable_when',
      type: 'textarea',
      admin: {
        description: 'Conditions under which the solution is applicable',
      },
    },
    {
      name: 'keywords',
      type: 'array',
      admin: {
        description: 'Relevant keywords for search and tagging',
      },
      fields: [
        {
          name: 'keyword',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      index: true,
    },
    {
      name: 'embeddingMetadata',
      type: 'group',
      admin: {
        description: 'Metadata for vector search embeddings',
        readOnly: true,
      },
      fields: [
        {
          name: 'embedding_id',
          type: 'text',
          admin: {
            description: 'ID of the embedding in vector database',
          },
        },
        {
          name: 'model',
          type: 'text',
          admin: {
            description: 'Embedding model used',
          },
        },
        {
          name: 'dimensions',
          type: 'number',
          admin: {
            description: 'Number of dimensions in embedding vector',
          },
        },
        {
          name: 'last_synced',
          type: 'date',
          admin: {
            description: 'When embedding was last synced',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
  endpoints: [getKbItemWithApiKey, updateKbItemMetadataWithApiKey],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-populate displayTitle from company or tip
        if (data?.companyOrTip?.company) {
          data.displayTitle = data.companyOrTip.company
        } else if (data?.companyOrTip?.tip) {
          const tipText =
            typeof data.companyOrTip.tip === 'string'
              ? data.companyOrTip.tip
              : String(data.companyOrTip.tip)
          data.displayTitle = tipText.length > 50 ? tipText.substring(0, 50) + '...' : tipText
        } else {
          data.displayTitle = 'Untitled'
        }
        return data
      },
    ],
    afterChange: [syncKnowledgeBaseToVectorDB],
    afterDelete: [deleteKnowledgeBaseFromVectorDB],
  },
  timestamps: true,
}
