'use client'

import { LinkButton } from '@/components/ui/link-button'
import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

function navHref(link: { type?: string | null; url?: string | null; reference?: unknown }) {
  if (
    link.type === 'reference' &&
    link.reference &&
    typeof link.reference === 'object' &&
    'value' in link.reference
  ) {
    const ref = link.reference as { relationTo: string; value: { slug?: string } }
    const slug = ref.value?.slug
    if (slug) return `${ref.relationTo !== 'pages' ? `/${ref.relationTo}` : ''}/${slug}`
  }
  return link.url ?? '#'
}

export const HeaderNav: React.FC<{
  data: HeaderType
  inverted?: boolean
}> = ({ data, inverted }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        const href = navHref(link)
        return (
          <LinkButton
            key={i}
            href={href}
            external={link.newTab ?? false}
            size="sm"
            className={inverted ? 'text-white' : undefined}
          >
            {link.label}
          </LinkButton>
        )
      })}
    </nav>
  )
}
