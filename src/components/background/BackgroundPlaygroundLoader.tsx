'use client'

import nextDynamic from 'next/dynamic'

/** Leva and persisted params only load when this route is visited. Landing uses DEFAULT_BACKGROUND_CONTROLS only. */
export const BackgroundPlaygroundLoader = nextDynamic(
  () =>
    import('@/components/background/BackgroundPlayground').then((m) => m.BackgroundPlayground),
  { ssr: false },
)
