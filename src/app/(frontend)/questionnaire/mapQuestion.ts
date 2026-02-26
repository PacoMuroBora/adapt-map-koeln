import type { Question as PayloadQuestion } from '@/payload-types'

import type { Question } from './questions'

const BE_TYPE_TO_FRONTEND: Record<PayloadQuestion['type'], Question['type']> = {
  singleChoice: 'singleChoice',
  singleChoiceWithIcon: 'singleChoiceWithIcon',
  multiChoice: 'multiChoice',
  dropdown: 'dropdown',
  slider: 'slider',
  sliderHorizontalRange: 'sliderHorizontalRange',
  sliderVertical: 'sliderVertical',
  number: 'number',
  address: 'address',
  plz: 'plz',
  location_GPS: 'location_GPS',
  iconSelection: 'iconSelection',
  group: 'group',
  textarea: 'textarea',
  text: 'text',
  consent: 'consent',
  ageWheel: 'ageWheel',
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
    sliderConfig: p.sliderConfig
      ? {
          min: p.sliderConfig.min,
          max: p.sliderConfig.max,
          step: p.sliderConfig.step,
          unit: p.sliderConfig.unit ?? undefined,
        }
      : undefined,
    sliderVerticalConfig:
      p.sliderVerticalConfig != null
        ? {
            min: p.sliderVerticalConfig.min,
            max: p.sliderVerticalConfig.max,
            step: p.sliderVerticalConfig.step,
            labelTop: p.sliderVerticalConfig.labelTop,
            labelBottom: p.sliderVerticalConfig.labelBottom,
          }
        : undefined,
    numberConfig: p.numberConfig
      ? {
          min: p.numberConfig.min ?? undefined,
          max: p.numberConfig.max ?? undefined,
          placeholder: p.numberConfig.placeholder ?? undefined,
          unit: p.numberConfig.unit ?? undefined,
        }
      : undefined,
    textareaConfig: p.textareaConfig
      ? {
          maxLength: p.textareaConfig.maxLength ?? undefined,
          rows: p.textareaConfig.rows ?? undefined,
        }
      : undefined,
    consentConfig: p.consentConfig
      ? {
          consentText: p.consentConfig.consentText,
          consentVersion: p.consentConfig.consentVersion ?? undefined,
        }
      : undefined,
    ageWheelConfig:
      p.type === 'ageWheel' && p.ageWheelConfig != null
        ? {
            min: p.ageWheelConfig.min,
            max: p.ageWheelConfig.max,
            startValue: p.ageWheelConfig.startValue ?? undefined,
          }
        : undefined,
    groupFields: p.type === 'group' ? [] : undefined,
  }
}
