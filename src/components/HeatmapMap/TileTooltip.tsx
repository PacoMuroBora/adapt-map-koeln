'use client'

type ValueCounts = Record<number, number>

type TileTooltipProps = {
  totalCount: number
  averageProblemIndex: number
  valueCounts: ValueCounts
  x: number
  y: number
  className?: string
}

export function TileTooltip({
  totalCount,
  averageProblemIndex,
  valueCounts,
  x,
  y,
  className = '',
}: TileTooltipProps) {
  const entries = Object.entries(valueCounts)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => a[0] - b[0])

  return (
    <div
      className={`absolute z-50 max-w-[260px] rounded-lg border border-border/50 bg-white p-3 shadow-lg ${className}`}
      style={{ left: x, top: y, pointerEvents: 'none' }}
    >
      <h4 className="mb-1.5 text-xs font-bold text-gray-900 sm:text-sm">Kachel-Statistik</h4>
      <p className="text-[11px] text-gray-700 sm:text-xs">
        <span className="font-medium">Einträge gesamt:</span> {totalCount}
      </p>
      <p className="mb-2 text-[11px] text-gray-700 sm:text-xs">
        <span className="font-medium">Ø Problem-Index:</span> {averageProblemIndex.toFixed(1)}
      </p>
      <h5 className="mb-1 text-[10px] font-semibold text-gray-800 sm:text-xs">Verteilung</h5>
      <ul className="max-h-32 list-inside list-disc overflow-y-auto text-[10px] text-gray-600 sm:text-[11px]">
        {entries.map(([idx, count]) => (
          <li key={idx}>
            Index {idx}: {count} {count === 1 ? 'Eintrag' : 'Einträge'}
          </li>
        ))}
      </ul>
    </div>
  )
}
