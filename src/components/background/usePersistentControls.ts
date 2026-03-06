'use client'

import { useEffect } from 'react'
import { folder, useControls } from 'leva'

export type InteractionMode = 'none' | 'mouse' | 'scroll' | 'mouse+scroll' | 'auto'

export interface BackgroundControls {
  gridCellSize: number
  gridGap: number
  gridBorderWidth: number
  lineThreshold: number
  lineSnap: boolean

  fieldNoiseScale: number
  fieldSpeed: number
  fieldContrast: number
  fieldBrightness: number

  squareColor: string
  lineColor: string

  interactionMode: InteractionMode
  interactionPointerRadius: number
  interactionPointerStrength: number
  interactionScrollStrength: number
  trailStrength: number
  trailFadeSeconds: number
}

const STORAGE_KEY = 'background-playground:v1'

/** Default controls for the heat dither grid (e.g. landing page background). */
export const DEFAULT_BACKGROUND_CONTROLS: BackgroundControls = {
  gridCellSize: 17,
  gridGap: 6,
  gridBorderWidth: 1,
  lineThreshold: 0.97,
  lineSnap: false,

  fieldNoiseScale: 0.5,
  fieldSpeed: 0.5,
  fieldContrast: 1.6,
  fieldBrightness: 0,

  squareColor: '#f3fccb',
  lineColor: '#dafa38',

  interactionMode: 'mouse+scroll',
  interactionPointerRadius: 0.05,
  interactionPointerStrength: 1.04,
  interactionScrollStrength: 0.94,
  trailStrength: 0.5,
  trailFadeSeconds: 0.8,
}

/** Same as defaults but interactionMode 'mouse' only — scroll is used for parallax translation only, not for fading the noise. */
export const LANDING_BACKGROUND_CONTROLS: BackgroundControls = {
  ...DEFAULT_BACKGROUND_CONTROLS,
  interactionMode: 'mouse',
}

export interface PersistentControlsResult {
  values: BackgroundControls
  resetToDefaults: () => void
  exportToJSON: () => string
  loadFromJSON: (json: string) => void
}

export function usePersistentBackgroundControls(): PersistentControlsResult {
  const [values, setValues] = useControls(
    'Background',
    () => ({
      Grid: folder(
        {
          gridCellSize: {
            value: DEFAULT_BACKGROUND_CONTROLS.gridCellSize,
            min: 8,
            max: 96,
            step: 1,
          },
          gridGap: { value: DEFAULT_BACKGROUND_CONTROLS.gridGap, min: 0, max: 16, step: 0.5 },
          gridBorderWidth: {
            value: DEFAULT_BACKGROUND_CONTROLS.gridBorderWidth,
            min: 0,
            max: 4,
            step: 0.1,
          },
          lineThreshold: {
            value: DEFAULT_BACKGROUND_CONTROLS.lineThreshold,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Line start threshold',
          },
          lineSnap: {
            value: DEFAULT_BACKGROUND_CONTROLS.lineSnap,
            label: 'Snap seam lines',
          },
        },
        { collapsed: false },
      ),
      Field: folder(
        {
          fieldNoiseScale: {
            value: DEFAULT_BACKGROUND_CONTROLS.fieldNoiseScale,
            min: 0.1,
            max: 4,
            step: 0.05,
          },
          fieldSpeed: { value: DEFAULT_BACKGROUND_CONTROLS.fieldSpeed, min: 0, max: 1, step: 0.01 },
          fieldContrast: {
            value: DEFAULT_BACKGROUND_CONTROLS.fieldContrast,
            min: 0.5,
            max: 3,
            step: 0.05,
          },
          fieldBrightness: {
            value: DEFAULT_BACKGROUND_CONTROLS.fieldBrightness,
            min: -0.5,
            max: 1.5,
            step: 0.02,
          },
        },
        { collapsed: false },
      ),
      Color: folder(
        {
          squareColor: {
            value: DEFAULT_BACKGROUND_CONTROLS.squareColor,
            label: 'Square color (light)',
          },
          lineColor: {
            value: DEFAULT_BACKGROUND_CONTROLS.lineColor,
            label: 'Seam line color (dark)',
          },
        },
        { collapsed: false },
      ),
      Interaction: folder(
        {
          interactionMode: {
            options: {
              none: 'none',
              mouse: 'mouse',
              scroll: 'scroll',
              'mouse+scroll': 'mouse+scroll',
              auto: 'auto',
            },
            value: DEFAULT_BACKGROUND_CONTROLS.interactionMode,
          },
          interactionPointerRadius: {
            value: DEFAULT_BACKGROUND_CONTROLS.interactionPointerRadius,
            min: 0,
            max: 0.8,
            step: 0.01,
          },
          interactionPointerStrength: {
            value: DEFAULT_BACKGROUND_CONTROLS.interactionPointerStrength,
            min: 0,
            max: 2,
            step: 0.01,
          },
          interactionScrollStrength: {
            value: DEFAULT_BACKGROUND_CONTROLS.interactionScrollStrength,
            min: 0,
            max: 2,
            step: 0.01,
          },
          trailStrength: {
            value: DEFAULT_BACKGROUND_CONTROLS.trailStrength,
            min: 0,
            max: 1,
            step: 0.05,
            label: 'Trail paint strength',
          },
          trailFadeSeconds: {
            value: DEFAULT_BACKGROUND_CONTROLS.trailFadeSeconds,
            min: 0.5,
            max: 4,
            step: 0.1,
            label: 'Trail fade (s)',
          },
        },
        { collapsed: false },
      ),
    }),
    // Ensure schema is created only once
    [],
  )

  // Load persisted state once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<BackgroundControls> & {
        colorLight?: string
        colorDark?: string
        gridDarkBorderThreshold?: number
      }
      if (parsed && typeof parsed === 'object') {
        // Backward-compat for older presets using colorLight/colorDark
        const migrated = {
          ...parsed,
          squareColor: parsed.squareColor ?? parsed.colorLight,
          lineColor: parsed.lineColor ?? parsed.colorDark,
          lineThreshold: parsed.lineThreshold ?? parsed.gridDarkBorderThreshold,
          trailStrength: parsed.trailStrength ?? DEFAULT_BACKGROUND_CONTROLS.trailStrength,
          trailFadeSeconds: parsed.trailFadeSeconds ?? DEFAULT_BACKGROUND_CONTROLS.trailFadeSeconds,
        }
        setValues(migrated as any)
      }
    } catch {
      // ignore corrupted presets
    }
  }, [setValues])

  // Persist whenever values change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const serializable = {
        ...DEFAULT_BACKGROUND_CONTROLS,
        ...(values as Partial<BackgroundControls>),
      } as BackgroundControls
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      // ignore quota / privacy mode issues
    }
  }, [values])

  const resetToDefaults = () => {
    setValues(DEFAULT_BACKGROUND_CONTROLS as any)
  }

  const exportToJSON = () => {
    const serializable = {
      ...DEFAULT_BACKGROUND_CONTROLS,
      ...(values as Partial<BackgroundControls>),
    } as BackgroundControls
    return JSON.stringify(serializable, null, 2)
  }

  const loadFromJSON = (json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<BackgroundControls>
      if (!parsed || typeof parsed !== 'object') return
      const merged = {
        ...DEFAULT_BACKGROUND_CONTROLS,
        ...parsed,
      } as BackgroundControls
      setValues(merged as any)
    } catch {
      // ignore invalid input
    }
  }

  return {
    values: values as BackgroundControls,
    resetToDefaults,
    exportToJSON,
    loadFromJSON,
  }
}
