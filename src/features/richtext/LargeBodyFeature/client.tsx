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
import { Type } from 'lucide-react'
import React from 'react'

import { $createLargeParagraphNode, $isLargeParagraphNode, LargeParagraphNode } from './nodes/LargeParagraphNode'

const LargeTextIcon: React.FC = () => <Type className="size-4" />

const setLargeParagraph = (): void => {
  const selection = $getSelection()
  if (selection && $isRangeSelection(selection)) {
    $setBlocksType(selection, () => $createLargeParagraphNode())
  }
}

export const LargeBodyFeatureClient = createClientFeature({
  nodes: [LargeParagraphNode],
  toolbarFixed: {
    groups: [
      toolbarTextDropdownGroupWithItems([
        {
          ChildComponent: LargeTextIcon,
          key: 'largeParagraph',
          label: () => 'Large text',
          isActive: ({ selection }) => {
            if (!selection || !$isRangeSelection(selection)) return false
            for (const node of selection.getNodes()) {
              if ($isLargeParagraphNode(node)) continue
              const parent = node.getParent()
              if ($isLargeParagraphNode(parent)) continue
              return false
            }
            return true
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              setLargeParagraph()
            })
          },
          order: 0.5,
        },
      ]),
    ],
  },
  toolbarInline: {
    groups: [
      toolbarTextDropdownGroupWithItems([
        {
          ChildComponent: LargeTextIcon,
          key: 'largeParagraph',
          label: () => 'Large text',
          isActive: ({ selection }) => {
            if (!selection || !$isRangeSelection(selection)) return false
            for (const node of selection.getNodes()) {
              if ($isLargeParagraphNode(node)) continue
              const parent = node.getParent()
              if ($isLargeParagraphNode(parent)) continue
              return false
            }
            return true
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              setLargeParagraph()
            })
          },
          order: 0.5,
        },
      ]),
    ],
  },
})
