import React, { Fragment } from 'react'

import type { Props } from './types'

import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'

export const Media: React.FC<Props> = (props) => {
  const { className, htmlElement = 'div', resource } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag: React.ElementType | null = htmlElement || Fragment

  if (Tag === null) {
    return isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} />
  }

  const AnyTag = Tag as any

  return (
    <AnyTag
      {...(htmlElement !== null
        ? {
            className,
          }
        : {})}
    >
      {isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} />}
    </AnyTag>
  )
}
