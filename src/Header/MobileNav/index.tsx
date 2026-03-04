'use client'

import { ArrowUpRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { navHref } from '../utils'

type HeaderNavItem = NonNullable<Header['navItems']>[number]

export interface HeaderMobileNavProps {
  /** Header global data (nav items + optional button). */
  data: Header
  /** Controlled open state. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Hamburger icon color context: use light icon on dark background (e.g. questionnaire hero). */
  triggerClassName?: string
}

/**
 * Mobile navigation: hamburger trigger and slide-out sheet with nav links and CTA button.
 */
export function HeaderMobileNav({
  data,
  open,
  onOpenChange,
  triggerClassName,
}: HeaderMobileNavProps) {
  const navItems = data?.navItems ?? []
  const buttonLink = data?.button?.[0]?.link

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button type="button" aria-label="Menü öffnen" className={triggerClassName}>
          <Menu className="size-6" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full max-w-full flex-col justify-between border-0 bg-am-dark px-4 pb-20 pt-4 sm:max-w-full background-grid-dark"
        showCloseButton={false}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-0 pb-0 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link href="/" onClick={() => onOpenChange(false)} className="mt-0.5 flex items-center">
            <Logo className="text-am-white" height={20} />
          </Link>
          <SheetClose
            aria-label="Menü schließen"
            className="flex size-6 shrink-0 items-center justify-center rounded text-am-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-am-white focus:ring-offset-2 focus:ring-offset-am-dark"
          >
            <X className="size-6" aria-hidden />
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-20">
          <nav className="mt-8 flex flex-col gap-6 px-2" aria-label="Hauptnavigation">
            {navItems.map(({ link }: HeaderNavItem, i) => {
              const href = navHref(link)
              return (
                <SheetClose key={i} asChild>
                  <Link
                    href={href}
                    target={link.newTab ? '_blank' : undefined}
                    rel={link.newTab ? 'noopener noreferrer' : undefined}
                    className="flex gap-4 py-1.5 text-am-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-am-white focus:ring-offset-2 focus:ring-offset-am-dark"
                  >
                    <span className="font-headings text-[28px] font-semibold uppercase leading-[33px] tracking-[-0.25px]">
                      {link.label}
                    </span>
                    <ArrowUpRight className="size-6 shrink-0 -translate-y-0.5" aria-hidden />
                  </Link>
                </SheetClose>
              )
            })}
          </nav>
          {buttonLink && (
            <SheetClose asChild>
              <div className="inline-block">
                <CMSLink {...buttonLink} size="lg" appearance="default" />
              </div>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
