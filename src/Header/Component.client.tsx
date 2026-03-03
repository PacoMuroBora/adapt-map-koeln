'use client'

import Link from 'next/link'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

const SCROLL_THRESHOLD = 24
const LOGO_HEIGHT_DEFAULT = 24
const LOGO_HEIGHT_SCROLLED = 20
const tweenTransition = {
  type: 'tween' as const,
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const pathname = usePathname()
  const isQuestionnaire = pathname?.startsWith('/questionnaire')
  const [scrolled, setScrolled] = useState(false)
  const logoHeight = useMotionValue(LOGO_HEIGHT_DEFAULT)
  const [logoHeightSnapshot, setLogoHeightSnapshot] = useState(LOGO_HEIGHT_DEFAULT)

  useMotionValueEvent(logoHeight, 'change', setLogoHeightSnapshot)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll() // initial check
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const target = scrolled ? LOGO_HEIGHT_SCROLLED : LOGO_HEIGHT_DEFAULT
    animate(logoHeight, target, tweenTransition)
  }, [scrolled, logoHeight])

  return (
    <div className="fixed inset-x-0 top-0 z-20 p-4">
      <motion.header
        className="w-full rounded-full px-4 backdrop-blur-md"
        initial={false}
        animate={{
          height: scrolled ? 48 : 56,
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0)',
          borderColor: scrolled ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)',
          borderWidth: scrolled ? 1 : 0,
          boxShadow: scrolled ? '0 2px 12px rgba(0, 0, 0, 0.1)' : '0 0 0 rgba(0, 0, 0, 0)',
        }}
        transition={tweenTransition}
      >
        <div className="h-full flex items-center justify-between">
          <Link href="/">
            <span className="inline-block origin-left mt-px">
              <Logo
                className={scrolled || !isQuestionnaire ? 'text-black' : 'text-white'}
                height={logoHeightSnapshot}
              />
            </span>
          </Link>
          <HeaderNav data={data} inverted={!scrolled && isQuestionnaire} />
        </div>
      </motion.header>
    </div>
  )
}
