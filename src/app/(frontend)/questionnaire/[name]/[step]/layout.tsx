'use client'

import type React from 'react'

/** Just pass through. Provider lives in [name]/layout so it persists across step changes. */
export default function StepLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
