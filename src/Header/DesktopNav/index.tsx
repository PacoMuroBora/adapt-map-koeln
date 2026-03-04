'use client'

import { CMSLink } from '@/components/Link'
import { LinkButton } from '@/components/ui/link-button'
import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { navHref } from '../utils'

type DesktopButtonLink = NonNullable<HeaderType['button']>[number]['link']

export interface HeaderDesktopNavProps {
  /** Header global data (nav items + optional button). */
  data: HeaderType
  /** Use light text (e.g. on questionnaire hero). */
  inverted?: boolean
  /** Optional CTA button from header config (max 1). */
  buttonLink?: DesktopButtonLink | null
}

/**
 * Desktop navigation: horizontal nav links and optional CTA button.
 */
export function HeaderDesktopNav({ data, inverted, buttonLink }: HeaderDesktopNavProps) {
  const navItems = data?.navItems ?? []

  return (
    <nav className="flex items-center gap-8">
      {navItems.map(({ link }, i) => {
        const href = navHref(link)
        return (
          <LinkButton
            key={i}
            href={href}
            external={link.newTab ?? false}
            size="lg"
            className={inverted ? 'text-white' : undefined}
          >
            {link.label}
          </LinkButton>
        )
      })}
    </nav>
  )
}
