import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { DecoHeadingFeature } from '@/features/richtext/DecoHeadingFeature/server'
import { LargeBodyFeature } from '@/features/richtext/LargeBodyFeature/server'
import { OverlineFeature } from '@/features/richtext/OverlineFeature/server'

const headingLevels = [
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
] as const

export const HeatmapBlock: Block = {
  slug: 'heatmap',
  interfaceName: 'HeatmapBlock',
  labels: {
    singular: 'Heatmap',
    plural: 'Heatmaps',
  },
  fields: [
    {
      name: 'headline',
      type: 'text',
      required: true,
      label: 'Headline',
      admin: {
        description: 'Headline displayed above the heatmap.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'headlineSize',
          type: 'select',
          defaultValue: 'h2',
          label: 'Headline size (styling)',
          options: [...headingLevels],
        },
        {
          name: 'headlineTag',
          type: 'select',
          defaultValue: 'h2',
          label: 'Headline tag (SEO)',
          options: [...headingLevels],
        },
      ],
    },
    {
      name: 'richText',
      type: 'richText',
      label: 'Content below map',
      admin: {
        description: 'Optional rich text displayed below the heatmap.',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            DecoHeadingFeature(),
            LargeBodyFeature(),
            OverlineFeature(),
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
    },
  ],
}
