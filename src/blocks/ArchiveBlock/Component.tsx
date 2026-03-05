import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { Post } from '@/payload-types'

import { getPayloadClient } from '@/lib/payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'

type ArchiveCategory = {
  id?: string | null
}

type ArchiveBlockProps = {
  id?: string
  categories?: (string | ArchiveCategory)[] | null
  introContent?: DefaultTypedEditorState | null
  limit?: number | null
  populateBy?: 'collection' | 'selection' | null
  selectedDocs?: { value: string | Post }[] | null
}

export const ArchiveBlock: React.FC<ArchiveBlockProps> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []

  if (populateBy === 'collection') {
    const payload = await getPayloadClient()

    const flattenedCategories = categories?.map((category: string | ArchiveCategory) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const fetchedPosts = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      ...(flattenedCategories && flattenedCategories.length > 0
        ? {
            where: {
              categories: {
                in: flattenedCategories,
              },
            },
          }
        : {}),
    })

    posts = fetchedPosts.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedPosts = selectedDocs
        .map((post: { value: string | Post }) => {
          if (typeof post.value === 'object') return post.value
        })
        .filter((p): p is Post => p != null)

      posts = filteredSelectedPosts
    }
  }

  return (
    <div id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
