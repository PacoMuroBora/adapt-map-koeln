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

const defaultState: BackgroundControls = {
  gridCellSize: 17,
  gridGap: 6,
  gridBorderWidth: 1,
  lineThreshold: 0.97,
  lineSnap: false,

  fieldNoiseScale: 1.45,
  fieldSpeed: 0.76,
  fieldContrast: 1.6,
  fieldBrightness: 0,

  squareColor: '#bdfcdb',
  lineColor: '#0aefe6',

  interactionMode: 'mouse+scroll',
  interactionPointerRadius: 0.05,
  interactionPointerStrength: 1.76,
  interactionScrollStrength: 0.94,
  trailStrength: 0.4,
  trailFadeSeconds: 0.9,
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
          gridCellSize: { value: defaultState.gridCellSize, min: 8, max: 96, step: 1 },
          gridGap: { value: defaultState.gridGap, min: 0, max: 16, step: 0.5 },
          gridBorderWidth: { value: defaultState.gridBorderWidth, min: 0, max: 4, step: 0.1 },
          lineThreshold: {
            value: defaultState.lineThreshold,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Line start threshold',
          },
          lineSnap: {
            value: defaultState.lineSnap,
            label: 'Snap seam lines',
          },
        },
        { collapsed: false },
      ),
      Field: folder(
        {
          fieldNoiseScale: { value: defaultState.fieldNoiseScale, min: 0.1, max: 4, step: 0.05 },
          fieldSpeed: { value: defaultState.fieldSpeed, min: 0, max: 1, step: 0.01 },
          fieldContrast: { value: defaultState.fieldContrast, min: 0.5, max: 3, step: 0.05 },
          fieldBrightness: { value: defaultState.fieldBrightness, min: -0.5, max: 1.5, step: 0.02 },
        },
        { collapsed: false },
      ),
      Color: folder(
        {
          squareColor: {
            value: defaultState.squareColor,
            label: 'Square color (light)',
          },
          lineColor: {
            value: defaultState.lineColor,
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
            value: defaultState.interactionMode,
          },
          interactionPointerRadius: {
            value: defaultState.interactionPointerRadius,
            min: 0,
            max: 0.8,
            step: 0.01,
          },
          interactionPointerStrength: {
            value: defaultState.interactionPointerStrength,
            min: 0,
            max: 2,
            step: 0.01,
          },
          interactionScrollStrength: {
            value: defaultState.interactionScrollStrength,
            min: 0,
            max: 2,
            step: 0.01,
          },
          trailStrength: {
            value: defaultState.trailStrength,
            min: 0,
            max: 1,
            step: 0.05,
            label: 'Trail paint strength',
          },
          trailFadeSeconds: {
            value: defaultState.trailFadeSeconds,
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
          trailStrength: parsed.trailStrength ?? defaultState.trailStrength,
          trailFadeSeconds: parsed.trailFadeSeconds ?? defaultState.trailFadeSeconds,
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
        ...defaultState,
        ...(values as Partial<BackgroundControls>),
      } as BackgroundControls
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      // ignore quota / privacy mode issues
    }
  }, [values])

  const resetToDefaults = () => {
    setValues(defaultState as any)
  }

  const exportToJSON = () => {
    const serializable = {
      ...defaultState,
      ...(values as Partial<BackgroundControls>),
    } as BackgroundControls
    return JSON.stringify(serializable, null, 2)
  }

  const loadFromJSON = (json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<BackgroundControls>
      if (!parsed || typeof parsed !== 'object') return
      const merged = {
        ...defaultState,
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

