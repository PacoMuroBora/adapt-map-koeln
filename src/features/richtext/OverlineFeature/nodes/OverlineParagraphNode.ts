import type { EditorConfig, LexicalNode } from '@payloadcms/richtext-lexical/lexical'
import { $applyNodeReplacement, ParagraphNode, type SerializedParagraphNode } from '@payloadcms/richtext-lexical/lexical'

export const OVERLINE_PARAGRAPH_TYPE = 'overlineParagraph'

export const OVERLINE_PARAGRAPH_DATA_ATTR = 'data-lexical-block-type'

export type SerializedOverlineParagraphNode = SerializedParagraphNode & {
  type: typeof OVERLINE_PARAGRAPH_TYPE
}

export class OverlineParagraphNode extends ParagraphNode {
  static getType(): string {
    return OVERLINE_PARAGRAPH_TYPE
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    element.setAttribute(OVERLINE_PARAGRAPH_DATA_ATTR, OVERLINE_PARAGRAPH_TYPE)
    return element
  }

  static clone(node: OverlineParagraphNode): OverlineParagraphNode {
    return new OverlineParagraphNode(node.__key)
  }

  exportJSON(): SerializedOverlineParagraphNode {
    return {
      ...super.exportJSON(),
      type: OVERLINE_PARAGRAPH_TYPE,
    }
  }

  static importJSON(
    serializedNode: SerializedOverlineParagraphNode,
  ): OverlineParagraphNode {
    const node = $createOverlineParagraphNode()
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  convertToParagraphNode(): ParagraphNode {
    return new ParagraphNode(this.__key)
  }
}

export function $createOverlineParagraphNode(): OverlineParagraphNode {
  return $applyNodeReplacement(new OverlineParagraphNode(undefined))
}

export function $isOverlineParagraphNode(
  node: LexicalNode | null | undefined,
): node is OverlineParagraphNode {
  return node instanceof OverlineParagraphNode
}
