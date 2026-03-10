import type { StaticImageData } from 'next/image'
import NextImage from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

/** CSS classes for MediaBlock image size (used in RichText and layout) */
const mediaBlockSizeClasses: Record<string, string> = {
  small: 'max-w-xs',
  medium: 'max-w-md',
  large: 'max-w-2xl',
  full: 'w-full max-w-full',
}

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    className,
    enableGutter = true,
    imgClassName,
    media,
    size = 'medium',
    staticImage,
  } = props

  const sizeClass = mediaBlockSizeClasses[size] ?? mediaBlockSizeClasses.medium
  const mediaDoc = typeof media === 'object' && media !== null ? media : null

  return (
    <div
      className={cn(
        sizeClass,
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {staticImage ? (
        <NextImage
          src={staticImage}
          alt=""
          className={cn('w-full h-auto', imgClassName)}
        />
      ) : mediaDoc?.url ? (
        <NextImage
          src={getMediaUrl(mediaDoc.url, mediaDoc.updatedAt)}
          alt={mediaDoc.alt || ''}
          width={mediaDoc.width ?? 1200}
          height={mediaDoc.height ?? 900}
          className={cn('w-full h-auto', imgClassName)}
        />
      ) : null}
    </div>
  )
}
