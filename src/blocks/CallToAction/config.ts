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
