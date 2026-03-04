import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { RevealIn } from '@/components/RevealIn'
import { REVEAL_STAGGER } from '@/lib/animations'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText }) => {
  return (
    <div className="container h-screen md:h-auto flex items-center justify-center p-0 m-0 md:p-8 lg:p-16">
      <div className="w-full h-full flex flex-col justify-center bg-primary background-grid-primary md:rounded-2xl px-4 md:px-8 py-8 lg:p-16 space-y-8">
        <RevealIn delay={0}>
          <div className="max-w-[40rem] flex items-center">
            {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
          </div>
        </RevealIn>
        <div className="flex flex-col flex-wrap gap-8 items-start">
          {(links || []).map(({ link }, i) => (
            <RevealIn key={i} delay={(1 + i) * REVEAL_STAGGER}>
              <CMSLink {...link} />
            </RevealIn>
          ))}
        </div>
      </div>
    </div>
  )
}
