export interface QuestionOption {
  value: string
  label: string
}

export interface Question {
  id: string
  key: string
  title: string
  description?: string
  type: 'address' | 'location_GPS' | 'plz' | 'singleChoice' | 'multiChoice' | 'slider' | 'radio' | 'text' | 'iconSelection' | 'group'
  required: boolean
  options?: QuestionOption[]
  sliderConfig?: {
    min: number
    max: number
    step: number
  }
  groupFields?: Question[]
}
