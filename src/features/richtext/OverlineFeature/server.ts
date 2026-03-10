import { createServerFeature, createNode } from '@payloadcms/richtext-lexical'

import { i18n } from './i18n'
import { OverlineParagraphNode } from './nodes/OverlineParagraphNode'

export const OverlineFeature = createServerFeature({
  feature: () => ({
    ClientFeature: '@/features/richtext/OverlineFeature/client#OverlineFeatureClient',
    clientFeatureProps: null,
    i18n,
    nodes: [createNode({ node: OverlineParagraphNode })],
  }),
  key: 'overline',
})
