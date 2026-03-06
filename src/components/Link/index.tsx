import { Button, type ButtonProps } from '@/components/ui/button'
import React from 'react'

import type { LinkIconOption } from '@/fields/link'
import type { Page, Post, Questionnaire } from '@/payload-types'

type CMSLinkType = {
  appearance?: ButtonProps['variant'] | null
  className?: string
  disabled?: boolean | null
  iconAfter?: LinkIconOption | '' | null
  iconBefore?: LinkIconOption | '' | null
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts' | 'questionnaires'
    value: Page | Post | Questionnaire | string | number
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
    disabled,
    iconAfter,
    iconBefore,
    label,
    newTab,
    reference,
    size,
    url,
  } = props

  const refValue = reference?.value
  const hasSlug =
    type === 'reference' &&
    typeof refValue === 'object' &&
    refValue !== null &&
    'slug' in refValue &&
    refValue.slug
  const isQuestionnaireRef = type === 'reference' && reference?.relationTo === 'questionnaires'
  // When disabled, pass no href so Button renders <button disabled> (works natively). No under-construction redirect.
  const href =
    disabled !== true
      ? hasSlug
        ? `${reference!.relationTo !== 'pages' ? `/${reference!.relationTo}` : ''}/${refValue.slug}`
        : isQuestionnaireRef
          ? `/questionnaire/${(refValue as { name?: string }).name ?? 'current'}`
          : url
      : undefined

  if (!href && !disabled) return null
  if (disabled && !label) return null

  return (
    <Button
      className={className}
      disabled={disabled ?? false}
      disabledHoverLabel={disabled ? 'verfügbar ab 9.3.' : undefined}
      href={href ?? undefined}
      iconAfter={iconAfter != null && iconAfter !== '' ? iconAfter : undefined}
      iconBefore={iconBefore != null && iconBefore !== '' ? iconBefore : undefined}
      newTab={newTab ?? false}
      shape="round"
      size={size ?? undefined}
      variant={appearance ?? 'default'}
    >
      {label}
    </Button>
  )
}
