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

/** Fraction of viewport height over which saturation transition completes (smaller = less scroll to reach grayscale). */
const SATURATION_TRANSITION_ZONE = 0.35

/** Transition progress 0 (hero) -> 1 (scrolled): when first non-hero section top enters viewport from bottom. */
function getSaturationTransitionProgress(): number {
  const el = document.querySelector('[data-landing-nonhero-start]')
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const h = typeof window !== 'undefined' ? window.innerHeight : 800
  const zone = SATURATION_TRANSITION_ZONE * h
  if (rect.top >= h) return 0
  if (rect.top <= h - zone) return 1
  return (h - rect.top) / zone
}

export function LandingBackground({ children }: { children: React.ReactNode }) {
  const [parallaxOffsetY, setParallaxOffsetY] = useState(0)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const rafRef = useRef<number>(0)

  const handleScroll = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max <= 0 ? 0 : window.scrollY / max
    targetRef.current = progress * PARALLAX_STRENGTH
    setTransitionProgress(getSaturationTransitionProgress())
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Re-measure when DOM might have changed (e.g. first non-hero section mounts)
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTransitionProgress(getSaturationTransitionProgress())
    })
    obs.observe(document.body, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [])

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
      {/* Canvas: fixed, draws background + grid; saturation transition driven by scroll. */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <HeatDitherGridCanvas
          controls={LANDING_BACKGROUND_CONTROLS}
          parallaxOffsetY={parallaxOffsetY}
          transitionProgress={transitionProgress}
        />
      </div>
      {children}
    </div>
  )
}
