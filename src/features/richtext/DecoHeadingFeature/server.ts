import { createServerFeature, createNode } from '@payloadcms/richtext-lexical'

import { i18n } from './i18n'
import { DecoHeadingNode } from './nodes/DecoHeadingNode'

export const DecoHeadingFeature = createServerFeature({
  feature: () => ({
    ClientFeature: '@/features/richtext/DecoHeadingFeature/client#DecoHeadingFeatureClient',
    clientFeatureProps: null,
    i18n,
    nodes: [createNode({ node: DecoHeadingNode })],
  }),
  key: 'decoHeading',
})
