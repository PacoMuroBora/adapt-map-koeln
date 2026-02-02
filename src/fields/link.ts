import type { Field, GroupField } from 'payload'

import deepMerge from '@/utilities/deepMerge'

/** Matches Button variant. */
export type LinkAppearances =
  | 'default'
  | 'white'
  | 'black'
  | 'outline'
  | 'destructive'
  | 'ghost'
  | 'ghost-muted'

export const appearanceOptions: Record<LinkAppearances, { label: string; value: string }> = {
  default: { label: 'Default', value: 'default' },
  white: { label: 'White', value: 'white' },
  black: { label: 'Black', value: 'black' },
  outline: { label: 'Outline', value: 'outline' },
  destructive: { label: 'Destructive', value: 'destructive' },
  ghost: { label: 'Ghost', value: 'ghost' },
  'ghost-muted': { label: 'Ghost muted', value: 'ghost-muted' },
}

/** Matches Button size. */
export type LinkSizes = 'default' | 'sm' | 'lg' | 'icon' | 'mini' | 'tiny'

export const sizeOptions: { label: string; value: LinkSizes }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Small', value: 'sm' },
  { label: 'Large', value: 'lg' },
  { label: 'Icon', value: 'icon' },
  { label: 'Mini', value: 'mini' },
  { label: 'Tiny', value: 'tiny' },
]

/** Icon options for iconBefore / iconAfter (display labels for CMS). */
export type LinkIconOption =
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-up-right'
  | 'external-link'
  | 'plus'
  | 'close'

export const linkIconOptions: { label: string; value: LinkIconOption }[] = [
  { label: 'Arrow Right', value: 'arrow-right' },
  { label: 'Arrow Up', value: 'arrow-up' },
  { label: 'Arrow Down', value: 'arrow-down' },
  { label: 'Arrow Up Right', value: 'arrow-up-right' },
  { label: 'External Link', value: 'external-link' },
  { label: 'Plus', value: 'plus' },
  { label: 'Close', value: 'close' },
]

type LinkType = (options?: {
  appearances?: LinkAppearances[] | false
  sizes?: LinkSizes[] | false
  iconBefore?: LinkIconOption[] | false
  iconAfter?: LinkIconOption[] | false
  disableLabel?: boolean
  overrides?: Partial<GroupField>
}) => Field

export const link: LinkType = ({
  appearances,
  sizes,
  iconBefore: iconBeforeOpt,
  iconAfter: iconAfterOpt,
  disableLabel = false,
  overrides = {},
} = {}) => {
  const linkResult: GroupField = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
            defaultValue: 'reference',
            options: [
              {
                label: 'Internal link',
                value: 'reference',
              },
              {
                label: 'Custom URL',
                value: 'custom',
              },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            admin: {
              style: {
                alignSelf: 'flex-end',
              },
              width: '50%',
            },
            label: 'Open in new tab',
          },
        ],
      },
    ],
  }

  const linkTypes: Field[] = [
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: 'Document to link to',
      relationTo: ['pages', 'posts'],
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
      },
      label: 'Custom URL',
      required: true,
    },
  ]

  if (!disableLabel) {
    linkTypes.map((linkType) => ({
      ...linkType,
      admin: {
        ...linkType.admin,
        width: '50%',
      },
    }))

    linkResult.fields.push({
      type: 'row',
      fields: [
        ...linkTypes,
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: 'Label',
          required: true,
        },
      ],
    })
  } else {
    linkResult.fields = [...linkResult.fields, ...linkTypes]
  }

  const appearanceField: Field | null =
    appearances !== false
      ? {
          name: 'appearance',
          type: 'select',
          admin: {
            description: 'Choose how the link should be rendered (Button variant).',
            width: '50%',
          },
          defaultValue: 'default',
          options: appearances
            ? appearances.map((a) => appearanceOptions[a])
            : (Object.values(appearanceOptions) as { label: string; value: string }[]),
        }
      : null

  const sizeField: Field | null =
    sizes !== false
      ? {
          name: 'size',
          type: 'select',
          admin: {
            description: 'Button size.',
            width: '50%',
          },
          defaultValue: 'default',
          options: sizes ? sizeOptions.filter((o) => sizes.includes(o.value)) : sizeOptions,
        }
      : null

  if (appearanceField || sizeField) {
    const rowFields: Field[] = []
    if (appearanceField) rowFields.push(appearanceField)
    if (sizeField) rowFields.push(sizeField)
    linkResult.fields.push({
      type: 'row',
      fields: rowFields,
    })
  }

  if (iconBeforeOpt !== false && iconAfterOpt !== false) {
    const beforeOptions =
      iconBeforeOpt && iconBeforeOpt.length > 0
        ? linkIconOptions.filter((o) => iconBeforeOpt.includes(o.value))
        : linkIconOptions
    const afterOptions =
      iconAfterOpt && iconAfterOpt.length > 0
        ? linkIconOptions.filter((o) => iconAfterOpt.includes(o.value))
        : linkIconOptions
    linkResult.fields.push({
      type: 'row',
      fields: [
        {
          name: 'iconBefore',
          type: 'select',
          admin: {
            description: 'Icon before the label.',
            width: '50%',
          },
          options: [{ label: 'None', value: '' }, ...beforeOptions],
        },
        {
          name: 'iconAfter',
          type: 'select',
          admin: {
            description: 'Icon after the label.',
            width: '50%',
          },
          options: [{ label: 'None', value: '' }, ...afterOptions],
        },
      ],
    })
  }

  return deepMerge(linkResult, overrides)
}
