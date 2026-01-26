'use client'

import { LoadMoreButton } from '@/components/ui/load-more-button'

export function InteractiveExamples() {
  return (
    <div className="flex flex-col gap-4 items-center">
      <LoadMoreButton onClick={() => console.log('Load more clicked')}>
        WEITER
      </LoadMoreButton>
      <LoadMoreButton isLoading>
        WEITER
      </LoadMoreButton>
      <LoadMoreButton disabled>
        WEITER
      </LoadMoreButton>
      <LoadMoreButton>Load More</LoadMoreButton>
    </div>
  )
}
