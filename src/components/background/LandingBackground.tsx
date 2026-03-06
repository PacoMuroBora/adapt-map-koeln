'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { HeatDitherGridCanvas } from './HeatDitherGridCanvas'
import { LANDING_BACKGROUND_CONTROLS } from './usePersistentControls' // mouse only so scroll = parallax move, no fade

// How much the noise translates (in normalized 0–1) per full scroll; texture moves opposite to scroll direction.
const PARALLAX_STRENGTH = 0.4
// Lerp factor per frame (0–1): higher = snappier, lower = smoother. ~0.08 = smooth follow.
const PARALLAX_LERP = 0.08

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function LandingBackground({ children }: { children: React.ReactNode }) {
  const [parallaxOffsetY, setParallaxOffsetY] = useState(0)
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const rafRef = useRef<number>(0)

  const handleScroll = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max <= 0 ? 0 : window.scrollY / max
    targetRef.current = progress * PARALLAX_STRENGTH
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    const tick = () => {
      const target = targetRef.current
      const current = currentRef.current
      const next = lerp(current, target, PARALLAX_LERP)
      if (Math.abs(next - current) > 1e-6) {
        currentRef.current = next
        setParallaxOffsetY(next)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Base layer: same as current hero (primary + grid look) */}
      <div className="fixed inset-0 -z-20 bg-primary" aria-hidden />
      {/* Canvas: fixed, parallax via shader offset. pointer-events-none so content is clickable; canvas uses window listeners for trail. */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <HeatDitherGridCanvas
          controls={LANDING_BACKGROUND_CONTROLS}
          parallaxOffsetY={parallaxOffsetY}
        />
      </div>
      {children}
    </div>
  )
}
