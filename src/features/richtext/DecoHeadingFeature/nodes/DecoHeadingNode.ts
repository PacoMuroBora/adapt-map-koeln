import type { EditorConfig, LexicalNode } from '@payloadcms/richtext-lexical/lexical'
import { $applyNodeReplacement, ParagraphNode, type SerializedParagraphNode } from '@payloadcms/richtext-lexical/lexical'

export const DECO_HEADING_TYPE = 'decoHeading'

export const DECO_HEADING_DATA_ATTR = 'data-lexical-block-type'

export type SerializedDecoHeadingNode = SerializedParagraphNode & { type: typeof DECO_HEADING_TYPE }

export class DecoHeadingNode extends ParagraphNode {
  static getType(): string {
    return DECO_HEADING_TYPE
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    element.setAttribute(DECO_HEADING_DATA_ATTR, DECO_HEADING_TYPE)
    return element
  }

  static clone(node: DecoHeadingNode): DecoHeadingNode {
    return new DecoHeadingNode(node.__key)
  }

  exportJSON(): SerializedDecoHeadingNode {
    return {
      ...super.exportJSON(),
      type: DECO_HEADING_TYPE,
    }
  }

  static importJSON(serializedNode: SerializedDecoHeadingNode): DecoHeadingNode {
    const node = $createDecoHeadingNode()
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  convertToParagraphNode(): ParagraphNode {
    return new ParagraphNode(this.__key)
  }
}

export function $createDecoHeadingNode(): DecoHeadingNode {
  return $applyNodeReplacement(new DecoHeadingNode(undefined))
}

export function $isDecoHeadingNode(node: LexicalNode | null | undefined): node is DecoHeadingNode {
  return node instanceof DecoHeadingNode
}
