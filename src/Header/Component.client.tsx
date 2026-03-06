'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { useQuestionnaireClose } from '@/app/(frontend)/questionnaire/QuestionnaireLayoutClient'
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
  const questionnaireClose = useQuestionnaireClose()
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

  const logoClassName = scrolled || !isQuestionnaire ? 'text-black' : 'text-white'
  const closeClassName =
    'flex size-6 items-center justify-center rounded text-am-dark transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-am-dark focus:ring-offset-2'

  const questionnaireCloseButton =
    questionnaireClose?.onAbort != null ? (
      <button
        type="button"
        onClick={questionnaireClose.onAbort}
        aria-label="Fragebogen schließen"
        className={scrolled ? closeClassName : `${closeClassName} text-white focus:ring-white`}
      >
        <X className="size-6" aria-hidden />
      </button>
    ) : (
      <Link
        href="/"
        aria-label="Fragebogen schließen"
        className={scrolled ? closeClassName : `${closeClassName} text-white focus:ring-white`}
      >
        <X className="size-6" aria-hidden />
      </Link>
    )

  const headerContent = (
    <div className="flex h-full w-full items-center justify-between px-4 md:px-0">
      <Link href="/" aria-label="Startseite">
        <span className="inline-block origin-left mt-1">
          <Logo className={logoClassName} height={logoHeightSnapshot} />
        </span>
      </Link>
      {isQuestionnaire ? (
        questionnaireCloseButton
      ) : (
        <>
          <div className="flex md:hidden">
            <HeaderMobileNav
              data={data}
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              triggerClassName={triggerClassName}
            />
          </div>
          <div className="hidden md:flex">
            <HeaderDesktopNav
              data={data}
              inverted={!scrolled && isQuestionnaire}
              buttonLink={buttonLink}
              scrolled={scrolled}
            />
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="fixed inset-x-0 top-0 z-20 p-2 md:p-4">
      {/* Nav Container */}
      <motion.header
        className="w-full rounded-full py-3 md:pl-4 md:pr-1 md:py-0"
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
          backdropFilter: scrolled ? 'blur(8px)' : 'blur(0px)',
          boxShadow: scrolled ? '0 2px 12px rgba(0, 0, 0, 0.1)' : '0 0 0 rgba(0, 0, 0, 0)',
        }}
        transition={tweenTransition}
      >
        {headerContent}
      </motion.header>
    </div>
  )
}
