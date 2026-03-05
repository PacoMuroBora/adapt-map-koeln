'use client'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { KBAnalytics } from './KBAnalytics'
import { KBList } from './KBList'

export function KBClient() {
  return (
    <DashboardShell>
      <div className="flex h-full flex-col gap-4">
        <div className="flex-1 min-h-0">
          <KBList />
        </div>
        <div className="h-64 min-h-[16rem]">
          <KBAnalytics />
        </div>
      </div>
    </DashboardShell>
  )
}

