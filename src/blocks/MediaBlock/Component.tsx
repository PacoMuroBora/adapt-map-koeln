import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

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
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    size = 'medium',
    staticImage,
    disableInnerContainer,
  } = props

  const sizeClass = mediaBlockSizeClasses[size] ?? mediaBlockSizeClasses.medium

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
      {(media || staticImage) && (
        <Media imgClassName={imgClassName} resource={media} src={staticImage} />
      )}
    </div>
  )
}
