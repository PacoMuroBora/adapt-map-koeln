import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '../../fields/linkGroup'

export const CallToAction: Block = {
  slug: 'cta',
  interfaceName: 'CallToActionBlock',
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    linkGroup({
      appearances: ['default', 'white', 'black', 'outline', 'destructive', 'ghost', 'ghost-muted'],
      sizes: ['default', 'sm', 'lg', 'icon', 'mini', 'tiny'],
      iconBefore: [
        'arrow-right',
        'arrow-up',
        'arrow-down',
        'arrow-up-right',
        'external-link',
        'plus',
        'close',
      ],
      iconAfter: [
        'arrow-right',
        'arrow-up',
        'arrow-down',
        'arrow-up-right',
        'external-link',
        'plus',
        'close',
      ],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
  labels: {
    plural: 'Calls to Action',
    singular: 'Call to Action',
  },
}
