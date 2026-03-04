'use client'

import Link from 'next/link'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderDesktopNav } from './DesktopNav'
import { HeaderMobileNav } from './MobileNav'
import {
  HEADER_HEIGHT,
  LOGO_HEIGHT_DEFAULT,
  LOGO_HEIGHT_SCROLLED,
  MOBILE_BREAKPOINT,
  SCROLL_THRESHOLD,
  tweenTransition,
} from './constants'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const pathname = usePathname()
  const isQuestionnaire = pathname?.startsWith('/questionnaire')
  const [scrolled, setScrolled] = useState(false)
  /** Mobile-first default so mobile reload doesn't flash desktop height before hydration */
  const [isMobile, setIsMobile] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const logoHeight = useMotionValue(LOGO_HEIGHT_DEFAULT)
  const [logoHeightSnapshot, setLogoHeightSnapshot] = useState(LOGO_HEIGHT_DEFAULT)
  const buttonLink = data?.button?.[0]?.link

  useMotionValueEvent(logoHeight, 'change', setLogoHeightSnapshot)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false)
  }, [isMobile])

  useEffect(() => {
    const target = scrolled ? LOGO_HEIGHT_SCROLLED : LOGO_HEIGHT_DEFAULT
    animate(logoHeight, target, tweenTransition)
  }, [scrolled, logoHeight])

  const triggerClassName = `shrink-0 size-6 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${
    !scrolled && isQuestionnaire
      ? 'text-white focus-visible:ring-white'
      : 'text-am-dark focus-visible:ring-am-dark'
  }`

  const headerContent = (
    <div className="flex h-full w-full items-center justify-between px-4 md:px-0">
      {/* Logo */}
      <Link href="/">
        <span className="inline-block origin-left mt-1">
          <Logo
            className={scrolled || !isQuestionnaire ? 'text-black' : 'text-white'}
            height={logoHeightSnapshot}
          />
        </span>
      </Link>
      {/* Mobile nav: visible only below md (768px) so no flash on reload */}
      <div className="flex md:hidden">
        <HeaderMobileNav
          data={data}
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          triggerClassName={triggerClassName}
        />
      </div>
      {/* Desktop nav: visible only at md and above */}
      <div className="hidden md:flex">
        <HeaderDesktopNav
          data={data}
          inverted={!scrolled && isQuestionnaire}
          buttonLink={buttonLink}
        />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-x-0 top-0 z-20 p-2 md:p-4">
      {/* Nav Container */}
      <motion.header
        className="w-full rounded-full py-3 md:px-4 md:py-0"
        initial={false}
        animate={{
          height: isMobile
            ? scrolled
              ? HEADER_HEIGHT.mobile.scrolled
              : HEADER_HEIGHT.mobile.default
            : scrolled
              ? HEADER_HEIGHT.desktop.scrolled
              : HEADER_HEIGHT.desktop.default,
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0)',
          backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
          borderColor: scrolled ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
          borderWidth: scrolled ? 1 : 0,
          boxShadow: scrolled ? '0 2px 12px rgba(0, 0, 0, 0.1)' : '0 0 0 rgba(0, 0, 0, 0)',
        }}
        transition={tweenTransition}
      >
        {headerContent}
      </motion.header>
    </div>
  )
}
