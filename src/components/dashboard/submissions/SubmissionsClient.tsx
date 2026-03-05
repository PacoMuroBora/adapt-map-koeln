'use client'

import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import type { Submission } from '@/payload-types'
import { SubmissionsAnalytics } from './SubmissionsAnalytics'
import { SubmissionsList } from './SubmissionsList'

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

  return (
    <DashboardShell>
      <div className="flex h-full flex-col gap-4">
        {/* Top row: list */}
        <div className="flex-1 min-h-0">
          <SubmissionsList onSelect={(item) => setSelected(item)} />
        </div>

        {/* Bottom row: analytics (line + bars) */}
        <div className="h-64 min-h-[16rem]">
          <SubmissionsAnalytics />
        </div>
      </div>
    </DashboardShell>
  )
}

