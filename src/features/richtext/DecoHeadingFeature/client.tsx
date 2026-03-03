'use client'

import { $setBlocksType } from '@payloadcms/richtext-lexical/lexical/selection'
import {
  $getSelection,
  $isRangeSelection,
} from '@payloadcms/richtext-lexical/lexical'
import {
  createClientFeature,
  toolbarTextDropdownGroupWithItems,
} from '@payloadcms/richtext-lexical/client'
import { Heading } from 'lucide-react'
import React from 'react'

import {
  $createDecoHeadingNode,
  $isDecoHeadingNode,
  DecoHeadingNode,
} from './nodes/DecoHeadingNode'

const DecoHeadingIcon: React.FC = () => <Heading className="size-4" />

const setDecoHeading = (): void => {
  const selection = $getSelection()
  if (selection && $isRangeSelection(selection)) {
    $setBlocksType(selection, () => $createDecoHeadingNode())
  }
}

export const DecoHeadingFeatureClient = createClientFeature({
  nodes: [DecoHeadingNode],
  toolbarFixed: {
    groups: [
      toolbarTextDropdownGroupWithItems([
        {
          ChildComponent: DecoHeadingIcon,
          key: 'decoHeading',
          label: () => 'Headline Deco',
          isActive: ({ selection }) => {
            if (!selection || !$isRangeSelection(selection)) return false
            for (const node of selection.getNodes()) {
              if ($isDecoHeadingNode(node)) continue
              const parent = node.getParent()
              if ($isDecoHeadingNode(parent)) continue
              return false
            }
            return true
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              setDecoHeading()
            })
          },
          order: -1,
        },
      ]),
    ],
  },
  toolbarInline: {
    groups: [
      toolbarTextDropdownGroupWithItems([
        {
          ChildComponent: DecoHeadingIcon,
          key: 'decoHeading',
          label: () => 'Headline Deco',
          isActive: ({ selection }) => {
            if (!selection || !$isRangeSelection(selection)) return false
            for (const node of selection.getNodes()) {
              if ($isDecoHeadingNode(node)) continue
              const parent = node.getParent()
              if ($isDecoHeadingNode(parent)) continue
              return false
            }
            return true
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              setDecoHeading()
            })
          },
          order: -1,
        },
      ]),
    ],
  },
})
