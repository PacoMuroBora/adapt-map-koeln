import React from 'react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'

const headlineSizeClasses: Record<NonNullable<HeroBlockProps['headlineSize']>, string> = {
  h1: 'text-h1 uppercase',
  h2: 'text-h2 uppercase',
  h3: 'text-h3 uppercase',
  h4: 'text-h4 uppercase',
  h5: 'text-h5 uppercase',
  h6: 'text-h6 uppercase',
}

export const HeroBlockComponent: React.FC<HeroBlockProps & { isLandingLayout?: boolean }> = ({
  headline,
  headlineSize = 'h2',
  headlineTag = 'h1',
  overline,
  richText,
  buttons,
  isLandingLayout: isLanding = false,
}) => {
  const size = headlineSize ?? 'h2'
  const tag = headlineTag ?? 'h1'
  const sizeClass = headlineSizeClasses[size]

  return (
    <div
      className={
        isLanding
          ? 'relative container px-4 py-8 md:px-8 md:py-12 lg:px-16 lg:py-24 flex flex-col justify-end w-screen h-screen bg-transparent'
          : 'relative container px-4 py-8 md:px-8 md:py-12 lg:px-16 lg:py-24 flex flex-col justify-end w-screen h-screen bg-primary'
      }
    >
      <div className="max-w-[48rem] space-y-2">
        {overline && (
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">
            {overline}
          </p>
        )}
        {headline && React.createElement(tag, { className: sizeClass }, headline)}
        {richText && (
          <RichText
            className="text-lg text-muted-foreground"
            data={richText}
            enableGutter={false}
          />
        )}
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
