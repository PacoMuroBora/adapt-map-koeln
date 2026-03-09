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
  /** Grid colors when scrolled (landing); lighter for white bg. */
  squareColorScrolled: string
  lineColorScrolled: string

  /** Base background color when using full-frame compositing (landing, hero). */
  backgroundColor: string
  /** Background color when scrolled (landing). */
  backgroundColorScrolled: string
  /** Saturation 0..1 at hero (top). */
  heroSaturation: number
  /** Saturation 0..1 when scrolled past hero. */
  scrolledSaturation: number
  /** Lerp factor per frame for saturation transition (e.g. 0.08). */
  saturationLerp: number

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
  squareColorScrolled: '#fcfcfc',
  lineColorScrolled: '#f8f8f8',

  backgroundColor: '#ffffff',
  backgroundColorScrolled: '#ffffff',
  heroSaturation: 1,
  scrolledSaturation: 1,
  saturationLerp: 0.08,

  interactionMode: 'mouse+scroll',
  interactionPointerRadius: 0.05,
  interactionPointerStrength: 1.04,
  interactionScrollStrength: 0.94,
  trailStrength: 0.5,
  trailFadeSeconds: 0.8,
}

/** Same as defaults but interactionMode 'mouse' only; includes landing background fill and saturation transition. */
export const LANDING_BACKGROUND_CONTROLS: BackgroundControls = {
  ...DEFAULT_BACKGROUND_CONTROLS,
  interactionMode: 'mouse',
  // Compensated input color so displayed hero background reads as #DAFA38
  // in the current renderer color pipeline.
  backgroundColor: '#EEFD81',
  // Slightly darker + more saturated than hero bg for subtle line contrast.
  lineColor: '#D3F620',
  backgroundColorScrolled: '#FFFFFF',
  squareColorScrolled: '#FCFCFC',
  lineColorScrolled: '#F8F8F8',
  heroSaturation: 1,
  scrolledSaturation: 0,
  saturationLerp: 0.08,
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
          squareColorScrolled: {
            value: DEFAULT_BACKGROUND_CONTROLS.squareColorScrolled,
            label: 'Square color scrolled',
          },
          lineColorScrolled: {
            value: DEFAULT_BACKGROUND_CONTROLS.lineColorScrolled,
            label: 'Line color scrolled',
          },
          backgroundColor: {
            value: DEFAULT_BACKGROUND_CONTROLS.backgroundColor,
            label: 'Background (landing fill)',
          },
          backgroundColorScrolled: {
            value: DEFAULT_BACKGROUND_CONTROLS.backgroundColorScrolled,
            label: 'Background scrolled',
          },
          heroSaturation: {
            value: DEFAULT_BACKGROUND_CONTROLS.heroSaturation,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Hero saturation',
          },
          scrolledSaturation: {
            value: DEFAULT_BACKGROUND_CONTROLS.scrolledSaturation,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Scrolled saturation',
          },
          saturationLerp: {
            value: DEFAULT_BACKGROUND_CONTROLS.saturationLerp,
            min: 0.01,
            max: 0.5,
            step: 0.01,
            label: 'Saturation lerp',
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
        const migrated = {
          ...parsed,
          squareColor: parsed.squareColor ?? parsed.colorLight,
          lineColor: parsed.lineColor ?? parsed.colorDark,
          squareColorScrolled:
            parsed.squareColorScrolled ?? DEFAULT_BACKGROUND_CONTROLS.squareColorScrolled,
          lineColorScrolled: parsed.lineColorScrolled ?? DEFAULT_BACKGROUND_CONTROLS.lineColorScrolled,
          lineThreshold: parsed.lineThreshold ?? parsed.gridDarkBorderThreshold,
          trailStrength: parsed.trailStrength ?? DEFAULT_BACKGROUND_CONTROLS.trailStrength,
          trailFadeSeconds: parsed.trailFadeSeconds ?? DEFAULT_BACKGROUND_CONTROLS.trailFadeSeconds,
          backgroundColor: parsed.backgroundColor ?? DEFAULT_BACKGROUND_CONTROLS.backgroundColor,
          backgroundColorScrolled:
            parsed.backgroundColorScrolled ?? DEFAULT_BACKGROUND_CONTROLS.backgroundColorScrolled,
          heroSaturation: parsed.heroSaturation ?? DEFAULT_BACKGROUND_CONTROLS.heroSaturation,
          scrolledSaturation:
            parsed.scrolledSaturation ?? DEFAULT_BACKGROUND_CONTROLS.scrolledSaturation,
          saturationLerp: parsed.saturationLerp ?? DEFAULT_BACKGROUND_CONTROLS.saturationLerp,
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
