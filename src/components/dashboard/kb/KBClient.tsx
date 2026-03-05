'use client'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { KBAnalytics } from './KBAnalytics'
import { KBList } from './KBList'

export function KBClient() {
  return (
    <DashboardShell>
      <div className="grid h-full grid-rows-[2fr_1fr] gap-8">
        <div className="min-h-0">
          <KBList />
        </div>
        <div className="min-h-0">
          <KBAnalytics />
        </div>
      </div>
    </DashboardShell>
  )
}

