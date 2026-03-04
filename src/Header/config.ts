import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { linkGroup } from '@/fields/linkGroup'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
          sizes: false,
          iconBefore: false,
          iconAfter: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
    linkGroup({
      appearances: false,
      sizes: false,
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
        name: 'button',
        maxRows: 1,
        admin: {
          description: 'Optional CTA button (e.g. "Fragebogen starten"). Shown only in mobile nav.',
        },
      },
    }),
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
