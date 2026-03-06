import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { HeroBlockComponent } from '@/blocks/HeroBlock/Component'
import { HeatmapBlockComponent } from '@/blocks/HeatmapBlock/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  heatmap: HeatmapBlockComponent,
  hero: HeroBlockComponent,
  mediaBlock: MediaBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['contentBlocks']
  /** When true, hero is transparent and other blocks use semi-transparent bg (landing page with generative background). */
  isLandingLayout?: boolean
}> = (props) => {
  const { blocks, isLandingLayout = false } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    // On landing, wrap each run of non-hero blocks in one bg layer to avoid overlapping opacity
    if (isLandingLayout) {
      const segments: { isHero: boolean; blocks: (typeof blocks)[number]; index: number }[][] = []
      let current: { isHero: boolean; blocks: (typeof blocks)[number]; index: number }[] = []
      let currentIsHero: boolean | null = null

      blocks.forEach((block, index) => {
        const blockType = block?.blockType
        const isHero = blockType === 'hero'
        if (currentIsHero !== null && isHero !== currentIsHero) {
          segments.push(current)
          current = []
        }
        currentIsHero = isHero
        current.push({ isHero, blocks: block, index })
      })
      if (current.length) segments.push(current)

      const firstNonHeroSegIdx = segments.findIndex((s) => !s[0].isHero)
      return (
        <Fragment>
          {segments.map((seg, segIdx) => {
            if (seg[0].isHero) {
              return (
                <Fragment key={segIdx}>
                  {seg.map(({ blocks: b, index }) => {
                    const bt = (b as { blockType?: string }).blockType
                    const Block = bt && bt in blockComponents ? blockComponents[bt as keyof typeof blockComponents] : null
                    return Block ? (
                      <div key={index}>
                        {/* @ts-expect-error block type spread */}
                        <Block {...b} disableInnerContainer isLandingLayout />
                      </div>
                    ) : null
                  })}
                </Fragment>
              )
            }
            return (
              <div
                key={segIdx}
                className="bg-transparent"
                {...(segIdx === firstNonHeroSegIdx ? { 'data-landing-nonhero-start': true } : {})}
              >
                {seg.map(({ blocks: b, index }) => {
                  const bt = (b as { blockType?: string }).blockType
                  const Block = bt && bt in blockComponents ? blockComponents[bt as keyof typeof blockComponents] : null
                  return Block ? (
                    <div key={index}>
                      {/* @ts-expect-error block type spread */}
                      <Block {...b} disableInnerContainer isLandingLayout />
                    </div>
                  ) : null
                })}
              </div>
            )
          })}
        </Fragment>
      )
    }

    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer isLandingLayout={false} />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
