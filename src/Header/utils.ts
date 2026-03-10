/**
 * Resolves href from a Payload link field (reference or custom URL).
 */
export function navHref(link: {
  type?: string | null
  url?: string | null
  reference?: unknown
}): string {
  if (
    link.type === 'reference' &&
    link.reference &&
    typeof link.reference === 'object' &&
    'value' in link.reference
  ) {
    const ref = link.reference as { relationTo: string; value: { slug?: string } }
    const slug = ref.value?.slug
    if (!slug) return '/'
    if (ref.relationTo === 'pages') {
      if (slug === '/') return '/'
      return `/${slug}`
    }
    return `/${ref.relationTo}/${slug}`
  }
  return link.url ?? '#'
}
