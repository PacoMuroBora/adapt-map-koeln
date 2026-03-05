'use client'

import React from 'react'
import { Leva } from 'leva'

import { HeatDitherGridCanvas } from './HeatDitherGridCanvas'
import { usePersistentBackgroundControls } from './usePersistentControls'

export const BackgroundPlayground: React.FC = () => {
  const { values, resetToDefaults, exportToJSON, loadFromJSON } = usePersistentBackgroundControls()

  const handleCopyPreset = async () => {
    try {
      const json = exportToJSON()
      await navigator.clipboard.writeText(json)
    } catch {
      // ignore clipboard errors
    }
  }

  const handleImportPreset = () => {
    if (typeof window === 'undefined') return
    // Lightweight import flow via prompt keeps UI minimal
    const json = window.prompt('Paste preset JSON')
    if (!json) return
    loadFromJSON(json)
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-transparent text-white">
      <div className="absolute inset-0">
        <HeatDitherGridCanvas controls={values} />
      </div>

      {/* Utility controls overlay */}
      <div className="pointer-events-auto fixed bottom-4 left-4 z-20 flex gap-2 rounded-full bg-black/70 px-4 py-2 text-xs backdrop-blur">
        <button
          type="button"
          onClick={resetToDefaults}
          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium text-white hover:bg-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleCopyPreset}
          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium text-white hover:bg-white/10"
        >
          Copy preset
        </button>
        <button
          type="button"
          onClick={handleImportPreset}
          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 font-medium text-white hover:bg-white/10"
        >
          Import preset
        </button>
      </div>

      {/* Leva mounts into its own portal, we just enable it here */}
      <Leva collapsed={false} />
    </main>
  )
}

