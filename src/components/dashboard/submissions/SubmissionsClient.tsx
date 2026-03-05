'use client'

import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { SubmissionsAnalytics } from './SubmissionsAnalytics'
import { SubmissionsList } from './SubmissionsList'

export type SubmissionListFilterTimeRange = 'all' | '7d' | '30d' | '90d'

type SubmissionSummary = {
  id: string
  createdAt: string
  problemIndex: number
  heatFrequency: string
  heatIntensity: number
  postalCode: string
  city?: string | null
  questionnaireVersion: string
  desiredChanges: string[]
  aiGeneratedAt: string | null
}

export function SubmissionsClient() {
  const [selected, setSelected] = useState<SubmissionSummary | null>(null)
  const [search, setSearch] = useState('')
  const [filterTimeRange, setFilterTimeRange] = useState<SubmissionListFilterTimeRange>('all')
  const [filterLocation, setFilterLocation] = useState('')

  return (
    <DashboardShell>
      <div className="flex h-full flex-col gap-10 py-6">
        {/* List: fills remaining space */}
        <div className="min-h-0 flex-1">
          <SubmissionsList
            onSelect={(item) => setSelected(item)}
            search={search}
            onSearchChange={setSearch}
            filterTimeRange={filterTimeRange}
            onFilterTimeRangeChange={setFilterTimeRange}
            filterLocation={filterLocation}
            onFilterLocationChange={setFilterLocation}
          />
        </div>

        {/* Chart cards: fixed height so list gets the rest on small screens */}
        <div className="h-[320px] flex-shrink-0">
          <SubmissionsAnalytics
            search={search}
            filterTimeRange={filterTimeRange}
            filterLocation={filterLocation}
          />
        </div>
      </div>
    </DashboardShell>
  )
}

