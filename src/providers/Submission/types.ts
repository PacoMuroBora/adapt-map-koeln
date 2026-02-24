export interface Location {
  lat: number
  lng: number
  postal_code: string | null
  city: string | null
  street?: string
  housenumber?: string
}

export interface PersonalFields {
  age?: number | null
  gender?: 'male' | 'female' | 'diverse' | 'prefer_not_to_say' | null
  householdSize?: number | null
}

export interface ConsentData {
  dataCollection: boolean
  cookieConsent: 'all' | 'necessary' | null
  consentVersion: string
  timestamp: string
}

export interface SubmissionState {
  // Current step in the journey
  currentStep: 'questionnaire' | 'results' | null

  // Consent data
  consent: ConsentData | null

  // Location data
  location: Location | null

  // Personal information
  personalFields: PersonalFields

  // Questionnaire data
  questionnaireVersion: string | null // Defaults to 'v1.0' for hardcoded questions
  answers: Record<string, any> // Keyed by question key (location, heatFrequency, heatIntensity, housingType, greenNeighborhood, cityArea, knowsTerm, description, desiredChanges)

  // Free text
  userText: string

  // Results (after submission)
  submissionId: string | null
  problemIndex: number | null
  subScores: Record<string, number> | null

  // AI recommendations
  aiSummary: string | null
  aiRecommendations: any[] | null
  aiGeneratedAt: string | null
}

export interface SubmissionContextType {
  state: SubmissionState
  updateConsent: (consent: ConsentData) => void
  updateLocation: (location: Location) => void
  updatePersonalFields: (fields: Partial<PersonalFields>) => void
  updateAnswer: (questionKey: string, answer: any) => void
  updateAnswers: (answers: Record<string, any>) => void
  updateUserText: (text: string) => void
  updateCurrentStep: (step: SubmissionState['currentStep']) => void
  updateQuestionnaireVersion: (version: string) => void
  updateResults: (data: {
    submissionId: string
    problemIndex: number
    subScores?: Record<string, number>
  }) => void
  updateAIResults: (data: {
    aiSummary: string
    aiRecommendations: any[]
    aiGeneratedAt: string
  }) => void
  reset: () => void
}

export const initialSubmissionState: SubmissionState = {
  currentStep: null,
  consent: null,
  location: null,
  personalFields: {},
  questionnaireVersion: 'v1.0', // Default version for hardcoded questions
  answers: {},
  userText: '',
  submissionId: null,
  problemIndex: null,
  subScores: null,
  aiSummary: null,
  aiRecommendations: null,
  aiGeneratedAt: null,
}
