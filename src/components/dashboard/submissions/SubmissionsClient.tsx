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
      <div className="grid h-full grid-rows-[2fr_1fr] gap-8">
        {/* Top row: list (2/3 height) */}
        <div className="min-h-0">
          <SubmissionsList onSelect={(item) => setSelected(item)} />
        </div>

        {/* Bottom row: analytics (1/3 height) */}
        <div className="min-h-0">
          <SubmissionsAnalytics />
        </div>
      </div>
    </DashboardShell>
  )
}

