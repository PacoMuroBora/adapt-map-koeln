import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Plus, ExternalLink } from 'lucide-react'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Design System | AdaptMap Köln',
  description: 'Headlines and button components from the AdaptMap design system',
}

const headingLevels = [
  {
    level: 1,
    label: 'Heading 1',
    className: 'font-headings text-h1',
    token: 'text-h1 · fluid 42px→64px @ 320px→1440px, 105% line-height',
  },
  {
    level: 2,
    label: 'Heading 2',
    className: 'font-headings text-h2',
    token: 'text-h2 · fluid 38px→52px, 105% line-height',
  },
  {
    level: 3,
    label: 'Heading 3',
    className: 'font-headings text-h3',
    token: 'text-h3 · fluid 34px→46px, 105% line-height',
  },
  {
    level: 4,
    label: 'Heading 4',
    className: 'font-headings text-h4',
    token: 'text-h4 · fluid 30px→40px, 120% line-height',
  },
  {
    level: 5,
    label: 'Heading 5',
    className: 'font-headings text-h5',
    token: 'text-h5 · fluid 26px→34px, 110% line-height',
  },
  {
    level: 6,
    label: 'Heading 6',
    className: 'font-headings text-h6',
    token: 'text-h6 · fluid 24px→28px, 120% line-height',
  },
] as const

const bodySizes = [
  {
    key: 'body-lg',
    className: 'font-body text-body-lg',
    token: 'text-body-lg · 18px, 135% line-height',
  },
  {
    key: 'body',
    className: 'font-body text-body',
    token: 'text-body · 16px, 130% line-height',
  },
  {
    key: 'body-sm',
    className: 'font-body text-body-sm',
    token: 'text-body-sm · 14px, 115% line-height',
  },
] as const

const buttonVariants = [
  'default',
  'black',
  'white',
  'outline',
  'destructive',
  'ghost',
  'ghost-muted',
] as const

const buttonSizes = ['tiny', 'mini', 'sm', 'default', 'lg', 'icon'] as const

const sizeLabels: Record<Exclude<(typeof buttonSizes)[number], 'icon'>, string> = {
  tiny: 'button tiny',
  mini: 'button mini',
  sm: 'button small',
  default: 'button default',
  lg: 'button large',
}

type ButtonVariant = (typeof buttonVariants)[number]
type ButtonSize = (typeof buttonSizes)[number]

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-headings text-h1 mb-2">Design System</h1>
      <p className="font-body text-body text-foreground-alt mb-12">
        Headlines and button components
      </p>

      {/* Headlines */}
      <section className="mb-16">
        <h2 className="font-headings text-h2 mb-8 border-b border-border pb-4">Headlines</h2>
        <div className="space-y-10">
          {headingLevels.map(({ level, label, className, token }) => (
            <div key={level} className="space-y-2">
              {React.createElement(`h${level}`, { className }, `${label} – The quick brown fox`)}
              <p className="font-body text-body-xs text-foreground-alt">{token}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Body text */}
      <section className="mb-16">
        <h2 className="font-headings text-h2 mb-8 border-b border-border pb-4">Body text</h2>
        <div className="space-y-6">
          {bodySizes.map(({ key, className, token }) => (
            <div key={key} className="space-y-2">
              <p className={className}>
                {key === 'body' && 'Body – The quick brown fox jumps over the lazy dog.'}
                {key === 'body-lg' && 'Body Large – The quick brown fox jumps over the lazy dog.'}
                {key === 'body-sm' && 'Body small – The quick brown fox jumps over the lazy dog.'}
              </p>
              <p className="font-body text-body-xs text-foreground-alt">{token}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons – by variant */}
      <section className="mb-16">
        <h2 className="font-headings text-h2 mb-8 border-b border-border pb-4">Buttons</h2>

        {buttonVariants.map((variant) => (
          <div key={variant} className="mb-12">
            <h3 className="font-body text-body font-semibold mb-4 capitalize">
              {variant.replace('-', ' ')}
            </h3>
            <div className="flex flex-wrap items-end gap-4">
              {buttonSizes.map((size) =>
                size === 'icon' ? (
                  <Button
                    key={`${variant}-${size}`}
                    variant={variant as ButtonVariant}
                    size={size as ButtonSize}
                    shape="round"
                    iconBefore={<Plus className="h-4 w-4" />}
                    aria-label="Add"
                  />
                ) : (
                  <Button
                    key={`${variant}-${size}`}
                    variant={variant as ButtonVariant}
                    size={size as ButtonSize}
                    shape="round"
                  >
                    {sizeLabels[size]}
                  </Button>
                ),
              )}
            </div>
          </div>
        ))}

        <div className="mb-12">
          <h3 className="font-body text-body font-semibold mb-4">Shapes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button shape="round">Default (rounded-lg)</Button>
            <Button shape="round">Round</Button>
            <Button variant="black" shape="round" size="lg">
              Round Large
            </Button>
            <Button
              variant="outline"
              shape="round"
              size="icon"
              iconBefore={<Plus className="h-4 w-4" />}
              aria-label="Add"
            />
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-body text-body font-semibold mb-4">With icon (default variant)</h3>
          <div className="flex flex-wrap gap-4">
            <Button shape="round" iconBefore={<Plus className="h-4 w-4" />}>
              Add item
            </Button>
            <Button
              variant="outline"
              size="sm"
              shape="round"
              iconBefore={<Plus className="h-3 w-3" />}
            >
              Small
            </Button>
            <Button
              variant="black"
              size="lg"
              shape="round"
              iconBefore={<Plus className="h-4 w-4" />}
              iconAfter={<Plus className="h-4 w-4" />}
            >
              Large
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-body text-body font-semibold mb-4">States</h3>
          <div className="flex flex-wrap gap-4">
            <Button shape="round" disabled>
              Disabled
            </Button>
            <Button variant="black" shape="round" disabled>
              Disabled secondary
            </Button>
            <Button variant="outline" shape="round" disabled>
              Disabled outline
            </Button>
            <Button variant="destructive" shape="round" disabled>
              Disabled destructive
            </Button>
            <Button variant="ghost" shape="round" disabled>
              Disabled ghost
            </Button>
          </div>
        </div>
      </section>

      {/* Link Buttons */}
      <section className="mb-16">
        <h2 className="font-headings text-h2 mb-8 border-b border-border pb-4">Link buttons</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-body text-body font-semibold mb-4">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <LinkButton href="/design-system" size="mini" shape="round">
                Mini
              </LinkButton>
              <LinkButton href="/design-system" size="sm" shape="round">
                Small
              </LinkButton>
              <LinkButton href="/design-system" size="default" shape="round">
                Default
              </LinkButton>
              <LinkButton href="/design-system" size="lg" shape="round">
                Large
              </LinkButton>
            </div>
          </div>
          <div>
            <h3 className="font-body text-body font-semibold mb-4">Shapes</h3>
            <div className="flex flex-wrap gap-4">
              <LinkButton href="/design-system" shape="round">
                Default shape
              </LinkButton>
              <LinkButton href="/design-system" shape="round">
                Round shape
              </LinkButton>
            </div>
          </div>
          <div>
            <h3 className="font-body text-body font-semibold mb-4">External</h3>
            <div className="flex flex-wrap gap-4">
              <LinkButton href="https://adaptmap.de" external shape="round">
                External link
                <ExternalLink className="ml-1 h-3 w-3 inline" />
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
