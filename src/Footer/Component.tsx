import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { LinkButton } from '@/components/ui/link-button'

function getLinkHref(link: NonNullable<Footer['legalLinks']>[number]['link']): string | null {
  if (!link) return null
  if (link.type === 'custom' && link.url) return link.url
  if (link.type === 'reference' && link.reference) {
    const value = link.reference.value
    const ref = typeof value === 'object' && value !== null && 'slug' in value ? value : null
    if (link.reference.relationTo === 'questionnaires' && ref && 'name' in ref) {
      return `/questionnaire/${(ref as { name?: string }).name ?? 'current'}`
    }
    if (ref && typeof (ref as { slug?: string }).slug === 'string') {
      const slug = (ref as { slug: string }).slug
      return link.reference.relationTo === 'pages'
        ? `/${slug}`
        : `/${link.reference.relationTo}/${slug}`
    }
  }
  return null
}
import { Logo } from '@/components/Logo/Logo'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const legalLinks = footerData?.legalLinks || []
  const address = footerData?.address
  const copyrightText = footerData?.copyrightText
  const subline = footerData?.subline
  const logos = footerData?.logos

  return (
    <footer className="mt-auto bg-am-purple text-black container pt-10 lg:pt-16 pb-6 min-h-[420px]">
      <div className="inner-container flex flex-col justify-between gap-32">
        {/* Address and adaptmap logo */}
        <div className="flex flex-col md:flex-row md:justify-between gap-16">
          <div className="flex flex-col gap-8">
            <Link className="flex items-center" href="/">
              <Logo height={40} />
            </Link>
            {address && (
              <RichText
                data={address}
                enableGutter={false}
                className="text-black text-sm max-w-md [&_.payload-richtext]:space-y-1"
              />
            )}
          </div>

          {/* Logos */}
          {logos && Array.isArray(logos.images) && logos.images.length > 0 && (
            <div className="flex flex-col gap-3 md:w-1/3">
              {logos.overline && (
                <p className="text-sm font-mono uppercase tracking-wide text-muted-foreground/70">
                  {logos.overline}
                </p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {logos.images.map(({ image }, i) =>
                  image && typeof image === 'object' ? (
                    <div key={i} className="flex h-16">
                      <Media
                        resource={image}
                        className="max-h-16 w-auto object-contain [&_img]:max-h-16 [&_img]:w-auto [&_img]:object-contain"
                      />
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Legal links */}
          <nav className="flex flex-wrap flex-row gap-4 pb-4">
            {legalLinks.map(({ link: linkData }, i) => {
              const href = linkData ? getLinkHref(linkData) : null
              const label = linkData?.label
              if (!href || !label) return null
              return (
                <LinkButton
                  key={i}
                  href={href}
                  external={linkData.newTab ?? false}
                  size={linkData.size ?? 'default'}
                >
                  {label}
                </LinkButton>
              )
            })}
          </nav>
          {(copyrightText || subline) && (
            <>
              {/* Divider */}
              <div className="w-full h-px bg-muted-foreground/70" />
              {/* Copyright text and subline */}
              <div className="w-full flex flex-col md:flex-row justify-between space-y-1">
                {copyrightText && (
                  <p className="text-body-sm text-muted-foreground/70">{copyrightText}</p>
                )}
                {subline && <p className="text-body-sm text-muted-foreground/70">{subline}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
