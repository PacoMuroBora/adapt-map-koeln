'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { cn } from '@/utilities/ui'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const pathname = usePathname()
  const isQuestionnaire = pathname?.startsWith('/questionnaire')

  return (
    <header className={cn('relative z-20 h-14', isQuestionnaire && 'bg-black')}>
      <div className="container py-4 flex justify-between">
        <Link href="/">
          <Logo className={isQuestionnaire ? 'text-white' : 'text-black'} height={24} />
        </Link>
        <HeaderNav data={data} inverted={isQuestionnaire} />
      </div>
    </header>
  )
}
