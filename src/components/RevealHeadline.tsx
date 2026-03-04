'use client'

import { motion } from 'motion/react'
import React from 'react'

import { cn } from '@/utilities/ui'

import {
  REVEAL_DURATION,
  REVEAL_EASE,
  REVEAL_LETTER_STAGGER,
  REVEAL_OFFSET_Y,
} from '@/lib/animations'

export interface RevealHeadlineProps {
  /** Headline text (each character animates in). */
  children: string
  /** HTML tag (h1–h6). */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  /** Stagger delay in seconds before this headline starts (for top-to-bottom order). */
  delay?: number
}

/**
 * Letter-by-letter fade in from bottom (16px) with opacity and stagger.
 */
export function RevealHeadline({
  children,
  as: Tag = 'h1',
  className,
  delay = 0,
}: RevealHeadlineProps) {
  const chars = Array.from(children)
  return (
    <Tag className={cn('inline-block', className)}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: REVEAL_OFFSET_Y }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px 0px -40px 0px' }}
          transition={{
            duration: REVEAL_DURATION,
            ease: REVEAL_EASE,
            delay: delay + i * REVEAL_LETTER_STAGGER,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Tag>
  )
}
