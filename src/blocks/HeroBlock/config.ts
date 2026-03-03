import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

const headingLevels = [
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
] as const

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'headline',
          type: 'text',
          required: true,
        },
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
          defaultValue: 'h1',
          label: 'Headline tag (SEO)',
          options: [...headingLevels],
        },
      ],
    },
    {
      name: 'overline',
      type: 'text',
    },
    {
      name: 'paragraph',
      type: 'textarea',
    },
    linkGroup({
      overrides: {
        name: 'buttons',
        maxRows: 2,
      },
    }),
  ],
}
