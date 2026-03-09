'use client'

import { COLOR_STOPS } from './GridTileLayer'

type ValueCounts = Record<number, number>

type TileTooltipProps = {
  totalCount: number
  averageProblemIndex: number
  averageHotDaysPerYear: number
  valueCounts: ValueCounts
  x: number
  y: number
  className?: string
}

export function TileTooltip({
  totalCount,
  averageProblemIndex,
  averageHotDaysPerYear,
  valueCounts,
  x,
  y,
  className = '',
}: TileTooltipProps) {
  // Clamp for slider position (0–100)
  const clampedIndex = Math.max(0, Math.min(100, averageProblemIndex))

  return (
    <div
      className={`pointer-events-none absolute z-50 rounded-[8px] bg-[rgba(241,241,241,0.88)] p-[12px] shadow-[6px_6px_24px_rgba(0,0,0,0.16)] backdrop-blur-[8px] ${className}`}
      style={{ left: x, top: y }}
    >
      <div className="flex flex-col gap-[12px]">
        {/* Row 1: Gefühlte Hitze with gradient slider */}
        <div className="flex items-center justify-between gap-3">
          <p className="w-[90px] text-xs font-mono uppercase tracking-wide text-am-darker">
            <span className="block">gefühlte</span>
            <span className="block">hitze ⌀</span>
          </p>
          <div className="flex h-[15px] w-[56px] shrink-0 items-center justify-center">
            <div
              className="relative h-[6px] w-full rounded-full"
              style={{
                background: `linear-gradient(to right, ${COLOR_STOPS.join(', ')})`,
              }}
            >
              <div
                className="absolute top-[-4px] h-[14px] w-[1px] bg-[rgba(20,20,24,0.9)]"
                style={{ left: `${clampedIndex}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Heisse Tage im Jahr with numeric value */}
        <div className="flex items-center justify-between gap-3 text-am-darker">
          <p className="w-[90px] text-xs font-mono uppercase tracking-wide">
            <span className="block">heisse tage</span>
            <span className="block">im jahr ⌀</span>
          </p>
          <p className="shrink-0 text-xl font-mono tracking-[0.01em]">
            {Math.round(averageHotDaysPerYear)}
          </p>
        </div>

        {/* Row 3: Einträge count */}
        <div className="flex items-center justify-between gap-3 text-am-darker">
          <p className="w-[90px] text-xs font-mono uppercase tracking-wide">einträge</p>
          <p className="shrink-0 text-xl font-mono tracking-[0.01em]">{totalCount}</p>
        </div>
      </div>
    </div>
  )
}
