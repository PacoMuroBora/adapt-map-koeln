import type { GlobalConfig } from 'payload'

import { defaultLexical } from '@/fields/defaultLexical'
import { link, linkButtonSizeOptions } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'address',
      type: 'richText',
      label: 'Address',
      admin: {
        description: 'Footer address block (e.g. organisation name, street, city).',
      },
      editor: defaultLexical,
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Legal / footer links',
      admin: {
        description: 'Links for Imprint, Privacy, Terms, etc.',
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
          sizes: linkButtonSizeOptions.map((o) => o.value),
          iconBefore: false,
          iconAfter: false,
          sizeDescription: 'Link size.',
        }),
      ],
      maxRows: 10,
    },
    {
      name: 'copyrightText',
      type: 'text',
      label: 'Copyright text',
      admin: {
        description: 'e.g. © 2025 Organisation name',
      },
    },
    {
      name: 'subline',
      type: 'text',
      label: 'Subline',
      admin: {
        description: 'Optional short line below copyright (e.g. tagline).',
      },
    },
    {
      name: 'logos',
      type: 'group',
      label: 'Logos',
      fields: [
        {
          name: 'overline',
          type: 'text',
          label: 'Overline',
          admin: {
            description: 'Small label above the logos (e.g. "Partner", "Gefördert durch").',
          },
        },
        {
          name: 'images',
          type: 'array',
          label: 'Logos',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              filterOptions: {
                mimeType: { contains: 'image' },
              },
            },
          ],
          maxRows: 12,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
