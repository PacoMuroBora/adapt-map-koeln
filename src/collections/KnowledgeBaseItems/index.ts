import type { CollectionConfig } from 'payload'

import { adminOrEditor } from '../../access/adminOrEditor'
import { anyone } from '../../access/anyone'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import {
  deleteKnowledgeBaseFromVectorDB,
  syncKnowledgeBaseToVectorDB,
} from './hooks/syncToVectorDB'
import {
  getKbItemWithApiKey,
  updateKbItemMetadataWithApiKey,
} from './endpoints/apiKeyAccess'

export const KnowledgeBaseItems: CollectionConfig = {
  slug: 'knowledge-base-items',
  admin: {
    useAsTitle: 'title_de',
    defaultColumns: ['title_de', 'category', 'status', 'createdAt'],
  },
  access: {
    read: authenticatedOrPublished,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOrEditor,
  },
  fields: [
    {
      name: 'title_de',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Title in German',
      },
    },
    {
      name: 'content_de',
      type: 'richText',
      required: true,
      admin: {
        description: 'Content in German',
      },
    },
    {
      name: 'tags',
      type: 'array',
      admin: {
        description: 'Tags for categorization and search',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Health', value: 'health' },
        { label: 'Infrastructure', value: 'infrastructure' },
        { label: 'Comfort', value: 'comfort' },
        { label: 'Resources', value: 'resources' },
        { label: 'Other', value: 'other' },
      ],
      index: true,
      admin: {
        description: 'Category for grouping items',
      },
    },
    {
      name: 'contact',
      type: 'group',
      admin: {
        description: 'Contact information for this item',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'Contact person or organization name',
          },
        },
        {
          name: 'email',
          type: 'email',
          admin: {
            description: 'Contact email',
          },
        },
        {
          name: 'phone',
          type: 'text',
          admin: {
            description: 'Contact phone number',
          },
        },
        {
          name: 'website',
          type: 'text',
          admin: {
            description: 'Contact website URL',
          },
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
    afterChange: [syncKnowledgeBaseToVectorDB],
    afterDelete: [deleteKnowledgeBaseFromVectorDB],
  },
  timestamps: true,
}
