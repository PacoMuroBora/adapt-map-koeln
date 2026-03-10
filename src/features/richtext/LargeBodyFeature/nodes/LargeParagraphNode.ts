import type { EditorConfig, LexicalNode } from '@payloadcms/richtext-lexical/lexical'
import { $applyNodeReplacement, ParagraphNode, type SerializedParagraphNode } from '@payloadcms/richtext-lexical/lexical'

export const LARGE_PARAGRAPH_TYPE = 'largeParagraph'

export const LARGE_PARAGRAPH_DATA_ATTR = 'data-lexical-block-type'

export type SerializedLargeParagraphNode = SerializedParagraphNode & { type: typeof LARGE_PARAGRAPH_TYPE }

export class LargeParagraphNode extends ParagraphNode {
  static getType(): string {
    return LARGE_PARAGRAPH_TYPE
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    element.setAttribute(LARGE_PARAGRAPH_DATA_ATTR, LARGE_PARAGRAPH_TYPE)
    return element
  }

  static clone(node: LargeParagraphNode): LargeParagraphNode {
    return new LargeParagraphNode(node.__key)
  }

  exportJSON(): SerializedLargeParagraphNode {
    return {
      ...super.exportJSON(),
      type: LARGE_PARAGRAPH_TYPE,
    }
  }

  static importJSON(serializedNode: SerializedLargeParagraphNode): LargeParagraphNode {
    const node = $createLargeParagraphNode()
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  convertToParagraphNode(): ParagraphNode {
    return new ParagraphNode(this.__key)
  }
}

export function $createLargeParagraphNode(): LargeParagraphNode {
  return $applyNodeReplacement(new LargeParagraphNode(undefined))
}

export function $isLargeParagraphNode(node: LexicalNode | null | undefined): node is LargeParagraphNode {
  return node instanceof LargeParagraphNode
}
