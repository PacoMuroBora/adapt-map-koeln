'use client'

import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/utilities/ui'
import type { KBChartVariant } from './KBAnalytics'
import { KBAnalytics } from './KBAnalytics'
import { KBList } from './KBList'

export function KBClient() {
  const [chartOpen, setChartOpen] = useState<KBChartVariant | null>(null)

  const toggleChart = (variant: KBChartVariant) => {
    setChartOpen((current) => (current === variant ? null : variant))
  }

  return (
    <DashboardShell>
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_2.5rem] gap-4 overflow-hidden py-0 md:grid-rows-[minmax(0,1fr)_320px] md:gap-10 md:py-6">
        <div className="min-h-0 overflow-hidden">
          <KBList />
        </div>

        <div className="flex h-14 gap-2 md:hidden">
          <Button
            variant={chartOpen === 'time' ? 'pill' : 'ghost-muted'}
            size="default"
            shape="round"
            className={cn('flex-1', chartOpen === 'time' && 'bg-am-green-alt text-am-dark')}
            onClick={() => toggleChart('time')}
          >
            Empfehlungen über Zeit
          </Button>
          <Button
            variant={chartOpen === 'distribution' ? 'pill' : 'ghost-muted'}
            size="default"
            shape="round"
            className={cn('flex-1', chartOpen === 'distribution' && 'bg-am-green-alt text-am-dark')}
            onClick={() => toggleChart('distribution')}
          >
            Top-Empfehlungen
          </Button>
        </div>

        <div className="hidden min-h-0 md:block">
          <KBAnalytics />
        </div>
      </div>

      <div className="md:hidden">
        <Sheet open={chartOpen !== null} onOpenChange={(open) => !open && setChartOpen(null)}>
          <SheetContent
            side="bottom"
            className="top-auto flex h-[50vh] max-h-[50vh] flex-col border-t border-border bg-background p-0"
          >
            <div className="flex-1 overflow-y-auto p-4">
              {chartOpen === 'time' && <KBAnalytics chart="time" />}
              {chartOpen === 'distribution' && <KBAnalytics chart="distribution" />}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardShell>
  )
}
