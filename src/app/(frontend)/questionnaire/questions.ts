export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  id: string
  key: string
  title: string
  description?: string
  type:
    | 'address'
    | 'location_GPS'
    | 'plz'
    | 'singleChoice'
    | 'singleChoiceWithIcon'
    | 'multiChoice'
    | 'dropdown'
    | 'slider'
    | 'sliderHorizontalRange'
    | 'sliderVertical'
    | 'ageWheel'
    | 'number'
    | 'textarea'
    | 'consent'
    | 'radio'
    | 'text'
    | 'iconSelection'
    | 'group'
  required: boolean
  options?: QuestionOption[]
  sliderConfig?: {
    min: number
    max: number
    step: number
    unit?: string
  }
  sliderVerticalConfig?: {
    min: number
    max: number
    step: number
    labelTop: string
    labelBottom: string
  }
  numberConfig?: {
    min?: number
    max?: number
    placeholder?: string
    unit?: string
  }
  textareaConfig?: {
    maxLength?: number
    rows?: number
  }
  consentConfig?: {
    consentText: string
    consentVersion?: string
  }
  ageWheelConfig?: {
    min: number
    max: number
    startValue?: number
  }
  groupFields?: Question[]
}
