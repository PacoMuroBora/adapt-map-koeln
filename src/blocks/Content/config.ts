import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { DecoHeadingFeature } from '@/features/richtext/DecoHeadingFeature/server'
import { LargeBodyFeature } from '@/features/richtext/LargeBodyFeature/server'
import { OverlineFeature } from '@/features/richtext/OverlineFeature/server'
import { link } from '@/fields/link'
import { linkGroup } from '@/fields/linkGroup'

const headingLevels = [
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
] as const

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    options: [
      {
        label: 'One Third',
        value: 'oneThird',
      },
      {
        label: 'Half',
        value: 'half',
      },
      {
        label: 'Two Thirds',
        value: 'twoThirds',
      },
      {
        label: 'Full',
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
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
    label: false,
  },
  {
    name: 'enableLink',
    type: 'checkbox',
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    {
      name: 'cardLayout',
      type: 'checkbox',
      defaultValue: false,
      label: 'Card Layout',
      admin: {
        description: 'Use a purple card layout for this block.',
      },
    },
    {
      name: 'overline',
      type: 'text',
      label: 'Overline',
      admin: {
        description: 'Optional small label above the headline.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'headline',
          type: 'text',
          label: 'Headline',
          admin: {
            description: 'Optional headline above the columns.',
          },
        },
        {
          name: 'headlineSize',
          type: 'select',
          defaultValue: 'h2',
          label: 'Headline size (styling)',
          options: [...headingLevels],
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.headline),
          },
        },
        {
          name: 'headlineTag',
          type: 'select',
          defaultValue: 'h2',
          label: 'Headline tag (SEO)',
          options: [...headingLevels],
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.headline),
          },
        },
      ],
    },
    {
      name: 'columns',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
    linkGroup({
      overrides: {
        name: 'buttons',
        label: 'Button',
        maxRows: 1,
        admin: {
          description: 'Optional button below the columns.',
        },
      },
    }),
  ],
}
