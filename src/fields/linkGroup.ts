import type { ArrayField, Field } from 'payload'

import type { LinkAppearances, LinkIconOption, LinkSizes } from './link'

import deepMerge from '@/utilities/deepMerge'
import { link } from './link'

type LinkGroupType = (options?: {
  appearances?: LinkAppearances[] | false
  sizes?: LinkSizes[] | false
  iconBefore?: LinkIconOption[] | false
  iconAfter?: LinkIconOption[] | false
  overrides?: Partial<ArrayField>
}) => Field

export const linkGroup: LinkGroupType = ({
  appearances,
  sizes,
  iconBefore,
  iconAfter,
  overrides = {},
} = {}) => {
  const generatedLinkGroup: Field = {
    name: 'links',
    type: 'array',
    fields: [
      link({
        appearances,
        sizes,
        iconBefore,
        iconAfter,
      }),
    ],
    admin: {
      initCollapsed: true,
    },
  }

  return deepMerge(generatedLinkGroup, overrides)
}
