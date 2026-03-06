import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'

export const CallToActionBlock: React.FC<CTABlockProps & { isLandingLayout?: boolean }> = ({
  links,
  richText,
}) => {
  return (
    <div className="container h-screen md:h-auto flex items-center justify-center p-0 m-0 md:p-8 lg:p-16">
      <div className="w-full h-full flex flex-col justify-center bg-primary background-grid-primary md:rounded-2xl px-4 md:px-8 py-8 lg:p-16 space-y-8">
        <div className="max-w-[40rem] flex items-center">
          {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
        </div>
        <div className="flex flex-col flex-wrap gap-8 items-start">
          {(links || []).map(({ link }, i) => (
            <CMSLink key={i} {...link} />
          ))}
        </div>
      </div>
    </div>
  )
}
