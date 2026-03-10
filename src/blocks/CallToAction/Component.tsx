import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'

import { Card, CardContent } from '@/components/ui/card'

export const CallToActionBlock: React.FC<CTABlockProps & { isLandingLayout?: boolean }> = ({
  links,
  richText,
}) => {
  return (
    <div className="container-card pt-4 md:py-8 lg:py-16">
      <Card
        variant="primary"
        className="inner-container h-screen md:h-auto flex flex-col justify-center py-8 md:py-12 lg:py-20 rounded-none md:rounded-3xl"
      >
        <CardContent className="space-y-8 !p-0">
          <div className="max-w-[40rem] flex items-center">
            {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
          </div>
          <div className="flex flex-col flex-wrap gap-8 items-start">
            {(links || []).map(({ link }, i) => (
              <CMSLink key={i} {...link} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
