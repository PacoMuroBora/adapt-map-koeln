'use client'

import { motion } from 'motion/react'
import React from 'react'

import { cn } from '@/utilities/ui'

import {
  REVEAL_DURATION,
  REVEAL_EASE,
  REVEAL_OFFSET_Y,
} from '@/lib/animations'

export interface RevealInProps {
  children: React.ReactNode
  /** Stagger delay in seconds (top-to-bottom order). */
  delay?: number
  className?: string
  as?: keyof typeof motion
}

/**
 * Fade in from bottom (16px) with opacity. Use with stagger for top-first order.
 */
export function RevealIn({
  children,
  delay = 0,
  className,
  as: Component = 'div',
}: RevealInProps) {
  const MotionComp = motion[Component] as typeof motion.div
  return (
    <MotionComp
      initial={{ opacity: 0, y: REVEAL_OFFSET_Y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px 0px -40px 0px' }}
      transition={{
        duration: REVEAL_DURATION,
        ease: REVEAL_EASE,
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </MotionComp>
  )
}
