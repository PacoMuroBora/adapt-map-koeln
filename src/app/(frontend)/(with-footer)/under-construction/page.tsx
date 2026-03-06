import { Construction } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function UnderConstructionPage() {
  return (
    <main className="min-h-[calc(100vh-var(--header-height,80px))] w-full bg-am-dark background-grid-dark flex flex-col items-center justify-center px-4 py-16 md:py-24">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-full border-2 border-am-green-alt/40 bg-am-dark text-am-green-alt md:size-24">
          <Construction className="size-10 md:size-12" aria-hidden />
        </div>
        <div className="space-y-3">
          <h1 className="font-headings text-h2 uppercase tracking-tight text-am-white">
            In Arbeit
          </h1>
          <p className="font-body text-body text-secondary">
            Dieser Bereich wird gerade fertiggestellt. Schau bald wieder vorbei.
          </p>
        </div>
        <p className="font-headings text-h3 uppercase tracking-tight text-am-green-alt border-2 border-am-green-alt/50 rounded-full px-6 py-4 bg-am-green-alt/10">
          Fragebogen verfügbar ab 9.3.2026
        </p>
        <Link href="/">
          <Button variant="default" size="lg" shape="round">
            Zur Startseite
          </Button>
        </Link>
      </div>
    </main>
  )
}
