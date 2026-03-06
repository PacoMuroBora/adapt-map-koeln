'use client'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { HeatmapMap } from '@/components/HeatmapMap'

export function MapClient() {
  return (
    <DashboardShell>
      <div className="flex h-full flex-col gap-8 py-6">
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl">
          <HeatmapMap
            className="h-full w-full"
            interactionGuardDisabled
          />
        </div>
      </div>
    </DashboardShell>
  )
}
