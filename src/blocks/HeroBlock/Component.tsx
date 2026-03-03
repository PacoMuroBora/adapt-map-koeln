import React from 'react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'

import { Shape03 } from '@/components/CustomShapes/shape03'

const headlineSizeClasses: Record<NonNullable<HeroBlockProps['headlineSize']>, string> = {
  h1: 'text-h1 uppercase',
  h2: 'text-h2 uppercase',
  h3: 'text-h3 uppercase',
  h4: 'text-h4 uppercase',
  h5: 'text-h5 uppercase',
  h6: 'text-h6 uppercase',
}

export const HeroBlockComponent: React.FC<HeroBlockProps> = ({
  headline,
  headlineSize = 'h2',
  headlineTag = 'h1',
  overline,
  paragraph,
  buttons,
}) => {
  const size = headlineSize ?? 'h2'
  const tag = headlineTag ?? 'h1'
  const sizeClass = headlineSizeClasses[size]

  return (
    <div className="relative container px-4 py-8 md:px-8 md:py-12 lg:px-16 lg:py-24 flex flex-col justify-end w-screen h-screen bg-primary background-grid-primary">
      <div className="absolute -right-4 -top-10 z-10 w-[min(80vw,80vmin)]">
        <Shape03 color="#F0FDAF" className="h-auto w-full" />
      </div>
      <div className="max-w-[48rem] space-y-2">
        {overline && (
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">
            {overline}
          </p>
        )}
        {headline && React.createElement(tag, { className: sizeClass }, headline)}
        {paragraph && <p className="text-lg text-muted-foreground">{paragraph}</p>}
        {Array.isArray(buttons) && buttons.length > 0 && (
          <ul className="flex flex-wrap gap-4 pt-12">
            {buttons.map(({ link }, i) => (
              <li key={i}>
                <CMSLink {...link} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
