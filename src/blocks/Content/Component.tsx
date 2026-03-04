import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '../../components/Link'
import { RevealHeadline } from '@/components/RevealHeadline'
import { RevealIn } from '@/components/RevealIn'
import { Shape01 } from '@/components/CustomShapes/shape01'
import { REVEAL_STAGGER } from '@/lib/animations'

const headlineSizeClasses: Record<NonNullable<ContentBlockProps['headlineSize']>, string> = {
  h1: 'text-h1 uppercase',
  h2: 'text-h2 uppercase',
  h3: 'text-h3 uppercase',
  h4: 'text-h4 uppercase',
  h5: 'text-h5 uppercase',
  h6: 'text-h6 uppercase',
}

export const ContentBlock: React.FC<ContentBlockProps> = (props) => {
  const {
    columns,
    cardLayout,
    headline,
    headlineSize = 'h2',
    headlineTag = 'h2',
    overline,
    buttons,
  } = props

  const colsSpanClasses = {
    full: '12',
    half: '6',
    oneThird: '4',
    twoThirds: '8',
  }

  const sizeClass = headlineSize ? headlineSizeClasses[headlineSize] : headlineSizeClasses.h2
  const tag = headlineTag ?? 'h2'

  return (
    <div className={cn('w-full my-12', { 'p-4 md:p-8 lg:p-16': cardLayout })}>
      <div
        className={cn('w-full', {
          'relative bg-am-purple rounded-2xl overflow-hidden': cardLayout,
        })}
      >
        {cardLayout && (
          <div className="absolute -right-4 top-2 md:-top-8 z-10 w-[min(35vw,35vmin)] max-w-[calc(100%-2rem)]">
            <Shape01 color="#9F94FF" className="h-auto w-full" />
          </div>
        )}
        <div className="container p-8 md:p-16">
          {(overline || headline) && (
            <div className="mb-12 md:mb-20 space-y-2 max-w-[66%] md:max-w-full">
              {overline && (
                <RevealIn delay={0 * REVEAL_STAGGER}>
                  <p className="text-sm font-mono uppercase tracking-wide text-muted-foreground">
                    {overline}
                  </p>
                </RevealIn>
              )}
              {headline && (
                <RevealHeadline
                  as={tag}
                  className={sizeClass}
                  delay={(overline ? 1 : 0) * REVEAL_STAGGER}
                >
                  {headline}
                </RevealHeadline>
              )}
            </div>
          )}
          <div className="grid grid-cols-4 lg:grid-cols-12 gap-y-4 md:gap-y-16 gap-x-16">
            {columns &&
              columns.length > 0 &&
              columns.map((col, index) => {
                const { enableLink, link, richText, size } = col
                const staggerDelay = (2 + index) * REVEAL_STAGGER
                return (
                  <div
                    className={cn(
                      `max-w-[800px] col-span-4 lg:col-span-${colsSpanClasses[size!]}`,
                      {
                        'md:col-span-2': size !== 'full',
                      },
                    )}
                  >
                    <RevealIn key={index} delay={staggerDelay}>
                      {richText && <RichText data={richText} enableGutter={false} />}
                      {enableLink && <CMSLink {...link} />}
                    </RevealIn>
                  </div>
                )
              })}
          </div>
          {Array.isArray(buttons) && buttons.length > 0 && (
            <RevealIn delay={(2 + (columns?.length ?? 0)) * REVEAL_STAGGER}>
              <ul className="mt-8 md:mt-12 flex flex-wrap gap-4">
                {buttons.map(({ link: buttonLink }, i) => (
                  <li key={i}>
                    <CMSLink {...buttonLink} />
                  </li>
                ))}
              </ul>
            </RevealIn>
          )}
        </div>
      </div>
    </div>
  )
}
