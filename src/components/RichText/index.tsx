import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type { BannerBlockProps } from '@/blocks/Banner/Component'
import type { CallToActionBlock as CTABlockProps, MediaBlock as MediaBlockProps } from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>

const headlineSizeClasses: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', string> = {
  h1: 'text-h1 uppercase',
  h2: 'text-h2 uppercase',
  h3: 'text-h3 uppercase',
  h4: 'text-h4 uppercase',
  h5: 'text-h5 uppercase',
  h6: 'text-h6 uppercase',
}

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return `/${slug}`
}

const bodySizeClasses = {
  default: 'font-body text-body',
  large: 'font-body text-body-lg',
} as const

/** CSS classes for RichText inline image sizes */
const richTextImageSizeClasses: Record<string, string> = {
  small: 'max-w-xs',
  medium: 'max-w-md',
  large: 'max-w-2xl',
  full: 'w-full max-w-full',
}

const createJsxConverters: (bodySize: 'default' | 'large') => JSXConvertersFunction<NodeTypes> =
  (bodySize) =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({ internalDocToHref }),
    upload: (args) => {
      const node = args.node as Record<string, unknown>
      const value = node.value as Record<string, unknown> | undefined
      if (!value || typeof value !== 'object') return null

      const url = value.url as string | undefined
      if (!url) return null

      const mimeType = value.mimeType as string | undefined
      if (!mimeType?.startsWith('image')) {
        return (
          <a href={url} rel="noopener noreferrer">
            {(value.filename as string) ?? url}
          </a>
        )
      }

      const alt = (value.alt as string) || (value.filename as string) || ''
      const fields = node.fields as { size?: string } | undefined
      const size = (fields?.size ?? 'full') as keyof typeof richTextImageSizeClasses
      const sizeClass = richTextImageSizeClasses[size] ?? richTextImageSizeClasses.full

      const sizes = value.sizes as Record<string, { url?: string; width?: number; mimeType?: string }> | undefined

      return (
        <span className={cn('my-4 block', sizeClass)}>
          {sizes && Object.keys(sizes).length > 0 ? (
            <picture>
              {Object.entries(sizes).map(([key, imgSize]) => {
                if (!imgSize?.url || !imgSize?.width || !imgSize?.mimeType) return null
                return (
                  <source
                    key={key}
                    media={`(max-width: ${imgSize.width}px)`}
                    srcSet={imgSize.url}
                    type={imgSize.mimeType}
                  />
                )
              })}
              <img src={url} alt={alt} className="w-full h-auto block" />
            </picture>
          ) : (
            <img src={url} alt={alt} className="w-full h-auto block" />
          )}
        </span>
      )
    },
    heading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const Tag = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const className = headlineSizeClasses[Tag]
      return <Tag className={className}>{children}</Tag>
    },
    decoHeading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const className = 'text-deco font-headings uppercase'
      if (!children?.length) {
        return (
          <h2 className={className}>
            <br />
          </h2>
        )
      }
      return <h2 className={className}>{children}</h2>
    },
    paragraph: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const className = bodySizeClasses[bodySize]
      if (!children?.length) {
        return (
          <p className={className} data-richtext-body="default">
            <br />
          </p>
        )
      }
      return (
        <p className={className} data-richtext-body="default">
          {children}
        </p>
      )
    },
    largeParagraph: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const className = 'font-body text-body-lg'
      if (!children?.length) {
        return (
          <p className={className} data-richtext-body="large">
            <br />
          </p>
        )
      }
      return (
        <p className={className} data-richtext-body="large">
          {children}
        </p>
      )
    },
    overlineParagraph: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const className = 'text-sm font-mono uppercase tracking-wide text-muted-foreground'
      if (!children?.length) {
        return (
          <p className={className}>
            <br />
          </p>
        )
      }
      return <p className={className}>{children}</p>
    },
    blocks: {
      banner: ({ node }: { node: { fields: BannerBlockProps } }) => (
        <BannerBlock className="col-start-2 mb-4" {...node.fields} />
      ),
      mediaBlock: ({ node }) => (
        <MediaBlock
          className="col-start-1 col-span-3"
          imgClassName="m-0"
          {...node.fields}
          captionClassName="max-w-[48rem]"
          enableGutter={false}
          disableInnerContainer={true}
        />
      ),
      code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
      cta: ({ node }) => <CallToActionBlock {...node.fields} />,
    },
  })

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  /** Use larger body text (text-body-lg). Default is normal body (text-body). */
  bodySize?: 'default' | 'large'
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableGutter = true, bodySize = 'default', ...rest } = props
  const converters = createJsxConverters(bodySize)
  return (
    <ConvertRichText
      converters={converters}
      className={cn(
        'payload-richtext space-y-4',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
        },
        className,
      )}
      {...rest}
    />
  )
}
