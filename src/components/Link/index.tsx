import { Button, type ButtonProps } from '@/components/ui/button'
import React from 'react'

import type { LinkIconOption } from '@/fields/link'
import type { Page, Post } from '@/payload-types'

type CMSLinkType = {
  appearance?: ButtonProps['variant']
  className?: string
  iconAfter?: LinkIconOption | '' | null
  iconBefore?: LinkIconOption | '' | null
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'default',
    className,
    iconAfter,
    iconBefore,
    label,
    newTab,
    reference,
    size,
    url,
  } = props

  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `${reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''}/${
          reference.value.slug
        }`
      : url

  if (!href) return null

  return (
    <Button
      className={className}
      href={href}
      iconAfter={iconAfter != null && iconAfter !== '' ? iconAfter : undefined}
      iconBefore={iconBefore != null && iconBefore !== '' ? iconBefore : undefined}
      newTab={newTab ?? false}
      shape="round"
      size={size}
      variant={appearance}
    >
      {label}
    </Button>
  )
}
