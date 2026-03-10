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
import { PanelTop } from 'lucide-react'
import React from 'react'

import {
  $createOverlineParagraphNode,
  $isOverlineParagraphNode,
  OverlineParagraphNode,
} from './nodes/OverlineParagraphNode'

const OverlineIcon: React.FC = () => <PanelTop className="size-4" />

const setOverlineParagraph = (): void => {
  const selection = $getSelection()
  if (selection && $isRangeSelection(selection)) {
    $setBlocksType(selection, () => $createOverlineParagraphNode())
  }
}

export const OverlineFeatureClient = createClientFeature({
  nodes: [OverlineParagraphNode],
  toolbarFixed: {
    groups: [
      toolbarTextDropdownGroupWithItems([
        {
          ChildComponent: OverlineIcon,
          key: 'overlineParagraph',
          label: () => 'Overline',
          isActive: ({ selection }) => {
            if (!selection || !$isRangeSelection(selection)) return false
            for (const node of selection.getNodes()) {
              if ($isOverlineParagraphNode(node)) continue
              const parent = node.getParent()
              if ($isOverlineParagraphNode(parent)) continue
              return false
            }
            return true
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              setOverlineParagraph()
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
          ChildComponent: OverlineIcon,
          key: 'overlineParagraph',
          label: () => 'Overline',
          isActive: ({ selection }) => {
            if (!selection || !$isRangeSelection(selection)) return false
            for (const node of selection.getNodes()) {
              if ($isOverlineParagraphNode(node)) continue
              const parent = node.getParent()
              if ($isOverlineParagraphNode(parent)) continue
              return false
            }
            return true
          },
          onSelect: ({ editor }) => {
            editor.update(() => {
              setOverlineParagraph()
            })
          },
          order: 0.5,
        },
      ]),
    ],
  },
})
