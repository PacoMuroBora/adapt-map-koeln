import React from 'react'

import type { HeatmapBlock as HeatmapBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { Card } from '@/components/ui/card'
import { HeatmapMap } from '@/components/HeatmapMap'

const headlineSizeClasses: Record<NonNullable<HeatmapBlockProps['headlineSize']>, string> = {
  h1: 'text-h1 uppercase',
  h2: 'text-h2 uppercase',
  h3: 'text-h3 uppercase',
  h4: 'text-h4 uppercase',
  h5: 'text-h5 uppercase',
  h6: 'text-h6 uppercase',
}

export const HeatmapBlockComponent: React.FC<HeatmapBlockProps> = ({
  headline,
  headlineSize = 'h2',
  headlineTag = 'h2',
  richText,
}) => {
  const sizeClass = headlineSize ? headlineSizeClasses[headlineSize] : headlineSizeClasses.h2
  const tag = headlineTag ?? 'h2'

  return (
    <div className="w-full">
      <div className="container px-4 py-8 md:px-8 md:py-12 lg:px-16 lg:py-24">
        {headline && (
          <div className="mb-6 md:mb-8 max-w-[800px]">
            {React.createElement(tag, { className: sizeClass }, headline)}
          </div>
        )}
        <Card className="relative h-[600px] w-full overflow-hidden">
          <HeatmapMap className="h-full w-full" />
        </Card>
        {richText && (
          <div className="mt-8 md:mt-12 max-w-[640px]">
            <RichText data={richText} enableGutter={false} />
          </div>
        )}
      </div>
    </div>
  )
}
