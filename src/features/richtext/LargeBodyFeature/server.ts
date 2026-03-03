import { createServerFeature, createNode } from '@payloadcms/richtext-lexical'

import { i18n } from './i18n'
import { LargeParagraphNode } from './nodes/LargeParagraphNode'

export const LargeBodyFeature = createServerFeature({
  feature: () => ({
    ClientFeature: '@/features/richtext/LargeBodyFeature/client#LargeBodyFeatureClient',
    clientFeatureProps: null,
    i18n,
    nodes: [createNode({ node: LargeParagraphNode })],
  }),
  key: 'largeBody',
})
