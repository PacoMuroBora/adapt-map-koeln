import type { Question as PayloadQuestion } from '@/payload-types'

import type { Question } from './questions'

const BE_TYPE_TO_FRONTEND: Record<PayloadQuestion['type'], Question['type']> = {
  singleChoice: 'singleChoice',
  multiChoice: 'multiChoice',
  slider: 'slider',
  address: 'address',
  plz: 'plz',
  location_GPS: 'location_GPS',
  iconSelection: 'iconSelection',
  group: 'group',
}

/**
 * Maps a Payload (backend) Question to the frontend Question shape used by QuestionClient.
 */
export function mapPayloadQuestionToFrontend(p: PayloadQuestion): Question {
  return {
    id: p.id,
    key: p.key,
    title: p.title_de,
    description: p.description_de ?? p.editorFields?.helpText ?? undefined,
    type: BE_TYPE_TO_FRONTEND[p.type] ?? 'text',
    required: p.required ?? false,
    options: p.options?.map((o) => ({ value: o.value, label: o.label })) ?? undefined,
    sliderConfig: p.sliderConfig,
    groupFields: p.type === 'group' ? [] : undefined,
  }
}
