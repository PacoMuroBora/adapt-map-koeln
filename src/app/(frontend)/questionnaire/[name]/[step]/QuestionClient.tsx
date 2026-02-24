'use client'

import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio'
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card'
import { Textarea } from '@/components/ui/textarea'
import { InputOTP } from '@/components/ui/input-otp'
import HeatIntensitySlider from '@/components/questionnaire/HeatIntensitySlider'
import HorizontalRangeSlider from '@/components/questionnaire/HorizontalRangeSlider'
import VerticalSlider from '@/components/questionnaire/VerticalSlider'
import IconSelection from '@/components/questionnaire/IconSelection'
import { AddressSearchInput } from '@/components/questionnaire/AddressSearchInput'
import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
import { LinkButton } from '@/components/ui/link-button'
import { useSubmission } from '@/providers/Submission'
import { useQuestionnaireNavigation } from '../../useQuestionnaireNavigation'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Question } from '../../questions'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

import { Home, Building, Plus, Target, TreePine } from 'lucide-react'
import { isValidColognePlz } from '@/utilities/colognePlz'
import PaginationSteps from '@/components/questionnaire/PaginationSteps'

type QuestionClientProps = {
  questionnaireName: string
  questions: Question[]
  stepTitle?: string
  stepDescription?: string
  stepNumber: number
  totalSteps: number
  /** Used to skip plz/address steps when user located via GPS */
  questionTypes: Question['type'][]
  nextButtonText: string
  previousButtonText: string
  /** Section theme colors (card bg and progress bar). When set, overrides default purple. */
  sectionColors?: { cardProgress: string; cardBg: string }
  /** When set, progress bar is section-scoped (only steps in this section) and only shown on step pages. */
  sectionStepsTotal?: number
  sectionStepNumber?: number
}

const STEPS_TO_SKIP_WHEN_GPS = ['plz', 'address'] as const

function getInitialStepAnswers(questions: Question[], stateAnswers: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const q of questions) {
    if (q.type === 'group' && q.groupFields) {
      const groupAnswer: Record<string, any> = {}
      for (const subQ of q.groupFields) {
        groupAnswer[subQ.key] = stateAnswers[subQ.key] ?? null
      }
      out[q.key] = groupAnswer
    } else {
      out[q.key] = stateAnswers[q.key] ?? null
    }
  }
  return out
}

export default function QuestionClient({
  questionnaireName,
  questions,
  stepTitle,
  stepDescription,
  stepNumber,
  totalSteps,
  questionTypes,
  nextButtonText,
  previousButtonText,
  sectionColors,
  sectionStepsTotal,
  sectionStepNumber,
}: QuestionClientProps) {
  const router = useRouter()
  const { state, updateAnswer, updateCurrentStep, updateLocation, updateUserText, updateConsent, updateResults } =
    useSubmission()

  const [stepAnswers, setStepAnswers] = useState<Record<string, any>>(() =>
    getInitialStepAnswers(questions, state.answers),
  )
  const setAnswer = (key: string, value: any) => {
    setStepAnswers((prev) => ({ ...prev, [key]: value }))
  }
  const getAnswer = (key: string) => stepAnswers[key] ?? null
  const [error, setError] = useState<string | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pendingPathRef = useRef<string | null>(null)
  const [isGpsLoading, setIsGpsLoading] = useState(false)
  const isLastStepWithConsent =
    stepNumber === totalSteps && questions.some((q) => q.type === 'consent')
  const resultsRoute = '/results'
  const feedbackRoute = '/feedback'

  const submitFromLastStep = useCallback(
    async (mergedAnswersOverride?: Record<string, any>) => {
    setIsSubmitting(true)
    setError(null)
    const mergedAnswers = mergedAnswersOverride ?? { ...state.answers, ...stepAnswers }
    const locationAnswer = mergedAnswers.location || {}

    // Resolve address object: may be under "location" or under the address question's key (only known on address step)
    const addressData =
      typeof locationAnswer === 'object' && locationAnswer !== null && 'street' in locationAnswer
        ? locationAnswer
        : (() => {
            for (const v of Object.values(mergedAnswers)) {
              if (
                v &&
                typeof v === 'object' &&
                'street' in v &&
                (typeof (v as any).postal_code === 'string' ||
                  typeof (v as any).city === 'string')
              ) {
                return v as {
                  street?: string
                  housenumber?: string
                  postal_code?: string
                  city?: string
                }
              }
            }
            return null
          })()

    let mergedLocation: {
      lat: number
      lng: number
      postal_code: string
      city?: string
      street?: string
    } | null = state.location
      ? {
          lat: state.location.lat,
          lng: state.location.lng,
          postal_code: state.location.postal_code!,
          city: state.location.city || (addressData?.city as string | undefined) || undefined,
          street:
            (addressData?.street as string | undefined) ||
            (state.location.street && state.location.housenumber
              ? `${state.location.street} ${state.location.housenumber}`.trim()
              : state.location.street) ||
            undefined,
        }
      : null

    if (!mergedLocation && addressData) {
      const street = addressData.street ?? ''
      const housenumber = addressData.housenumber ?? ''
      const postal_code = addressData.postal_code ?? ''
      const city = addressData.city ?? ''
      if (street?.trim() && (postal_code?.trim() || city?.trim())) {
        try {
          const geocodeRes = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              street: street.trim(),
              housenumber: (housenumber ?? '').trim() || undefined,
              postalcode: (postal_code ?? '').trim() || undefined,
              city: (city ?? '').trim() || undefined,
            }),
          })
          if (geocodeRes.ok) {
            const data = await geocodeRes.json()
            const pc = data.postal_code ?? postal_code ?? ''
            if (pc) {
              mergedLocation = {
                lat: data.lat,
                lng: data.lng,
                postal_code: pc,
                city: data.city ?? city ?? undefined,
                street: [street, housenumber].filter(Boolean).join(' ').trim() || data.address,
              }
            }
          }
        } catch {
          // leave mergedLocation null so we throw Standort fehlt below
        }
      }
    }

    const freeTextQuestion = questions.find((q) => q.type === 'textarea')
    const freeText = freeTextQuestion
      ? String(mergedAnswers[freeTextQuestion.key] ?? '').trim() || undefined
      : state.userText || undefined
    const personalFields = {
      ...state.personalFields,
      age: mergedAnswers.age ?? state.personalFields?.age ?? undefined,
      gender: mergedAnswers.gender ?? state.personalFields?.gender ?? undefined,
      householdSize: mergedAnswers.householdSize ?? state.personalFields?.householdSize ?? undefined,
    }

    try {
      if (!mergedLocation?.postal_code) {
        throw new Error('Standort fehlt. Bitte kehren Sie zur Standortseite zurück.')
      }
      if (Object.keys(mergedAnswers).length === 0) {
        throw new Error('Keine Antworten gefunden. Bitte beantworten Sie die Fragen.')
      }
      updateConsent({
        dataCollection: true,
        cookieConsent: 'necessary',
        consentVersion: '1.0',
        timestamp: new Date().toISOString(),
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem('cookieConsent', 'necessary')
      }
      const payload = {
        location: mergedLocation,
        questionnaireVersion: state.questionnaireVersion || 'v1.0',
        answers: mergedAnswers,
        personalFields: Object.keys(personalFields).length ? personalFields : undefined,
        freeText,
      }
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Fehler beim Speichern der Antworten')
      }
      const data = await response.json()
      updateResults({
        submissionId: data.submissionId,
        problemIndex: data.problemIndex,
        subScores: data.subScores,
      })
      if (freeText) updateUserText(freeText)
      updateCurrentStep('results')
      router.push(resultsRoute)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    state.answers,
    state.location,
    state.personalFields,
    state.questionnaireVersion,
    state.userText,
    stepAnswers,
    stepNumber,
    totalSteps,
    questions,
    updateConsent,
    updateResults,
    updateUserText,
    updateCurrentStep,
    router,
  ])

  const [resolvedAddress, setResolvedAddress] = useState<{
    postal_code: string
    city: string | null
    street?: string | null
    house_number?: string | null
  } | null>(null)

  const formatDisplayAddress = (addr: NonNullable<typeof resolvedAddress>) => {
    const streetPart = [addr.street, addr.house_number].filter(Boolean).join(' ')
    const placePart = [addr.postal_code, addr.city].filter(Boolean).join(' ')
    if (streetPart && placePart) return `${streetPart}, ${placePart}`
    return placePart || streetPart || ''
  }

  // Auto-dismiss error alert after 500ms
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 2500)
    return () => clearTimeout(timer)
  }, [error])

  const locationQuestion = questions.find((q) => q.type === 'location_GPS')

  // Sync resolvedAddress from state when user navigates back with existing location
  useEffect(() => {
    if (
      locationQuestion &&
      !resolvedAddress &&
      state.location?.postal_code &&
      state.answers[locationQuestion.key] === 'gps'
    ) {
      const loc = state.location
      setResolvedAddress({
        postal_code: loc.postal_code!,
        city: loc.city,
        street: loc.street || null,
        house_number: null,
      })
    }
  }, [locationQuestion?.key, state.location, state.answers, resolvedAddress])

  // Skip plz/address when user already used GPS (whole step is skippable)
  useEffect(() => {
    if (!state.location?.postal_code) return
    if (!questions.every((q) => STEPS_TO_SKIP_WHEN_GPS.includes(q.type as (typeof STEPS_TO_SKIP_WHEN_GPS)[number])))
      return
    if (stepNumber < totalSteps) {
      router.replace(`/questionnaire/${questionnaireName}/${stepNumber + 1}`)
    } else {
      router.replace('/feedback')
    }
  }, [
    questionnaireName,
    stepNumber,
    totalSteps,
    questions,
    state.location?.postal_code,
    router,
  ])

  // Initialize slider default for any slider question in step
  useEffect(() => {
    for (const q of questions) {
      if (
        q.type === 'slider' &&
        q.required &&
        (getAnswer(q.key) === null || getAnswer(q.key) === undefined)
      ) {
        const min = q.sliderConfig?.min ?? 0
        setAnswer(q.key, min)
      }
      if (
        q.type === 'sliderHorizontalRange' &&
        q.required &&
        (getAnswer(q.key) === null || getAnswer(q.key) === undefined)
      ) {
        const min = q.sliderConfig?.min ?? 0
        const max = q.sliderConfig?.max ?? 100
        setAnswer(q.key, [min, max])
      }
      if (
        q.type === 'sliderVertical' &&
        q.required &&
        (getAnswer(q.key) === null || getAnswer(q.key) === undefined)
      ) {
        const min = q.sliderVerticalConfig?.min ?? 0
        setAnswer(q.key, min)
      }
    }
  }, [])

  function isQuestionDisabled(question: Question, answer: any): boolean {
    if (question.type === 'location_GPS') return !resolvedAddress
    if (question.type === 'plz') {
      const plz = String(answer ?? '').trim()
      return plz.length !== 5 || !isValidColognePlz(plz)
    }
    if (question.type === 'singleChoice' || question.type === 'dropdown') {
      return answer == null || answer === ''
    }
    if (question.type === 'sliderHorizontalRange') {
      return (
        !Array.isArray(answer) ||
        answer.length !== 2 ||
        typeof answer[0] !== 'number' ||
        typeof answer[1] !== 'number'
      )
    }
    if (question.type === 'sliderVertical') {
      return answer === null || answer === undefined || typeof answer !== 'number'
    }
    if (question.type === 'consent') {
      return answer !== true
    }
    if (question.type === 'group' && question.groupFields) {
      for (const subQ of question.groupFields) {
        if (subQ.required && subQ.type === 'plz') {
          const plz = String((answer as Record<string, unknown>)?.[subQ.key] ?? '').trim()
          if (plz.length !== 5 || !isValidColognePlz(plz)) return true
        }
      }
    }
    return false
  }

  const isWeiterDisabled = (): boolean => {
    for (const q of questions) {
      const ans = q.type === 'group' && q.groupFields ? stepAnswers[q.key] : getAnswer(q.key)
      if (q.required && isQuestionDisabled(q, ans)) return true
    }
    return false
  }

  function validateOneQuestion(question: Question, answer: any): boolean {
    if (!question.required) return true
    if (question.type === 'group') {
      if (!question.groupFields) return true
      for (const subQ of question.groupFields) {
        if (subQ.required) {
          const subAnswer = (answer as Record<string, unknown>)?.[subQ.key]
          if (subQ.type === 'text') {
            if (!subAnswer || String(subAnswer).trim() === '') {
              setError(`Bitte beantworten Sie: ${subQ.title}`)
              return false
            }
          } else if (subQ.type === 'plz') {
            const plz = String(subAnswer ?? '').trim()
            if (!plz || plz.length !== 5) {
              setError(`Bitte geben Sie eine gültige 5-stellige Postleitzahl ein: ${subQ.title}`)
              return false
            }
            if (!isValidColognePlz(plz)) {
              setError('Bitte geben Sie eine gültige Postleitzahl von Köln ein.')
              return false
            }
          } else if (subAnswer === null || subAnswer === undefined || subAnswer === '') {
            setError(`Bitte beantworten Sie: ${subQ.title}`)
            return false
          }
        }
      }
      return true
    }
    if (question.type === 'iconSelection') {
      if (!answer || !Array.isArray(answer) || answer.length === 0) {
        setError('Bitte wählen Sie mindestens eine Option aus.')
        return false
      }
    } else if (question.type === 'slider') {
      if (answer === null || answer === undefined) {
        setError('Bitte wählen Sie einen Wert aus.')
        return false
      }
    } else if (question.type === 'sliderHorizontalRange') {
      if (
        !Array.isArray(answer) ||
        answer.length !== 2 ||
        typeof answer[0] !== 'number' ||
        typeof answer[1] !== 'number'
      ) {
        setError('Bitte wählen Sie einen Bereich aus.')
        return false
      }
    } else if (question.type === 'sliderVertical') {
      if (answer === null || answer === undefined || typeof answer !== 'number') {
        setError('Bitte wählen Sie einen Wert aus.')
        return false
      }
    } else if (question.type === 'address') {
      if (!answer || !answer.street || (answer.street as string).trim() === '') {
        setError('Bitte geben Sie eine Straße ein.')
        return false
      }
      const hasPlz =
        answer.postal_code &&
        String(answer.postal_code).trim().length === 5 &&
        isValidColognePlz(String(answer.postal_code).trim())
      const hasCity = answer.city && (answer.city as string).trim() !== ''
      if (!hasPlz && !hasCity) {
        setError('Bitte geben Sie eine PLZ (Köln) oder Stadt ein.')
        return false
      }
    } else if (question.type === 'location_GPS') {
      if (!state.location?.postal_code) {
        setError('Bitte ermitteln Sie Ihren Standort oder geben Sie die Adresse manuell ein.')
        return false
      }
      return true
    } else if (question.type === 'plz') {
      const plz = String(answer ?? '').trim()
      if (!plz || plz.length !== 5) {
        setError('Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.')
        return false
      }
      if (!isValidColognePlz(plz)) {
        setError('Bitte geben Sie eine gültige Postleitzahl von Köln ein.')
        return false
      }
    } else if (question.type === 'multiChoice') {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        setError('Bitte wählen Sie mindestens eine Option aus.')
        return false
      }
    } else if (question.type === 'consent') {
      if (answer !== true) {
        setError('Bitte akzeptieren Sie die Datenerhebung, um fortzufahren.')
        return false
      }
    } else {
      if (!answer || answer === '') {
        setError('Bitte beantworten Sie diese Frage.')
        return false
      }
    }
    return true
  }

  const validateAnswer = (): boolean => {
    for (const q of questions) {
      const ans = getAnswer(q.key)
      if (!validateOneQuestion(q, ans)) return false
    }
    return true
  }

  const {
    handleNext,
    handlePrevious,
    handleAbortQuestionnaire,
    handleConfirmAbort,
    showAbortDialog,
    setShowAbortDialog,
  } = useQuestionnaireNavigation(questionnaireName, {
    mode: 'step',
    stepNumber,
    totalSteps,
    questionTypes,
    questions,
    stepAnswers,
    state,
    updateAnswer,
    updateCurrentStep,
    validateAnswer,
    onBeforeNextNavigate: (path) => {
      if (path === feedbackRoute && isLastStepWithConsent) {
        const merged = { ...state.answers, ...stepAnswers }
        submitFromLastStep(merged)
        return
      }
      pendingPathRef.current = path
      setIsExiting(true)
      setTimeout(() => {
        if (pendingPathRef.current) {
          router.push(pendingPathRef.current)
          pendingPathRef.current = null
        }
      }, 220)
    },
    onBeforePrevNavigate: (path) => {
      pendingPathRef.current = path
      setIsExiting(true)
      setTimeout(() => {
        if (pendingPathRef.current) {
          router.push(pendingPathRef.current)
          pendingPathRef.current = null
        }
      }, 220)
    },
  })

  const handleGPSLocation = async () => {
    setIsGpsLoading(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von Ihrem Browser nicht unterstützt.')
      }

      const cachedPosition = localStorage.getItem('gps_position')
      if (cachedPosition) {
        try {
          const { position: cached, timestamp } = JSON.parse(cachedPosition)
          const age = Date.now() - timestamp
          const CACHE_VALIDITY = 5 * 60 * 1000

          if (age < CACHE_VALIDITY && cached.lat && cached.lng) {
            const response = await fetch('/api/reverse-geocode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: cached.lat, lng: cached.lng }),
            })

            if (response.ok) {
              const data = await response.json()
              const streetWithNumber = [data.street, data.house_number].filter(Boolean).join(' ')
              updateLocation({
                lat: cached.lat,
                lng: cached.lng,
                postal_code: data.postal_code,
                city: data.city,
                street: streetWithNumber || undefined,
              })
              if (locationQuestion) updateAnswer(locationQuestion.key, 'gps')
              setResolvedAddress({
                postal_code: data.postal_code,
                city: data.city,
                street: data.street || null,
                house_number: data.house_number || null,
              })
              return
            }
          }
        } catch {
          // Invalid cache, continue to get new position
        }
      }

      const GPS_TIMEOUT = 15000
      const MIN_ACCURACY = 100

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        let timeoutId: ReturnType<typeof setTimeout>

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (pos.coords.accuracy <= MIN_ACCURACY) {
              clearTimeout(timeoutId)
              navigator.geolocation.clearWatch(watchId)
              resolve(pos)
              return
            }
            if (!timeoutId) {
              timeoutId = setTimeout(() => {
                navigator.geolocation.clearWatch(watchId)
                resolve(pos)
              }, GPS_TIMEOUT)
            }
          },
          reject,
          { enableHighAccuracy: true, timeout: GPS_TIMEOUT, maximumAge: 60000 },
        )

        timeoutId = setTimeout(() => {
          navigator.geolocation.clearWatch(watchId)
          reject(new Error('Timeout'))
        }, GPS_TIMEOUT)
      })

      const { latitude, longitude } = position.coords

      try {
        localStorage.setItem(
          'gps_position',
          JSON.stringify({
            position: { lat: latitude, lng: longitude },
            timestamp: Date.now(),
          }),
        )
      } catch {
        // localStorage might be disabled
      }

      const response = await fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 429) {
          throw new Error(
            'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut oder verwenden Sie die manuelle Eingabe.',
          )
        }
        throw new Error(
          errorData.error ||
            'Geocodierung fehlgeschlagen. Bitte verwenden Sie die manuelle Eingabe.',
        )
      }

      const data = await response.json()

      if (!data.postal_code) {
        throw new Error(
          'Postleitzahl konnte nicht ermittelt werden. Bitte verwenden Sie die manuelle Eingabe.',
        )
      }

      const streetWithNumber = [data.street, data.house_number].filter(Boolean).join(' ')
      updateLocation({
        lat: latitude,
        lng: longitude,
        postal_code: data.postal_code,
        city: data.city,
        street: streetWithNumber || undefined,
      })
      if (locationQuestion) updateAnswer(locationQuestion.key, 'gps')
      setResolvedAddress({
        postal_code: data.postal_code,
        city: data.city,
        street: data.street || null,
        house_number: data.house_number || null,
      })
    } catch (err: unknown) {
      try {
        localStorage.removeItem('gps_position')
      } catch {
        // Ignore
      }

      const e = err as { code?: number; message?: string }
      if (e.code === 1) {
        setError(
          'Standortzugriff wurde verweigert. Bitte erlauben Sie den Standortzugriff in Ihren Browsereinstellungen oder verwenden Sie die manuelle Eingabe.',
        )
      } else if (e.code === 2) {
        setError(
          'Standort konnte nicht ermittelt werden. Bitte überprüfen Sie Ihre GPS-Einstellungen oder verwenden Sie die manuelle Eingabe.',
        )
      } else if (e.code === 3 || e.message === 'Timeout') {
        setError(
          'Zeitüberschreitung bei der Standortermittlung. Bitte versuchen Sie es erneut oder verwenden Sie die manuelle Eingabe.',
        )
      } else {
        setError(
          e.message ||
            'Fehler bei der Standortermittlung. Bitte verwenden Sie die manuelle Eingabe.',
        )
      }
    } finally {
      setIsGpsLoading(false)
    }
  }

  const handleManualAddress = () => {
    if (locationQuestion) {
      updateAnswer(locationQuestion.key, 'manual')
    }
    updateLocation({ lat: 0, lng: 0, postal_code: null, city: null })
    updateCurrentStep('questionnaire')
    if (stepNumber < totalSteps) {
      router.push(`/questionnaire/${questionnaireName}/${stepNumber + 1}`)
    } else {
      router.push('/feedback')
    }
  }

  const renderQuestionInput = (question: Question, answer: any, setAnswerForQ: (v: any) => void) => {
    switch (question.type) {
      case 'location_GPS':
        if (resolvedAddress) {
          return (
            <div className="space-y-8 flex flex-col items-center">
              <div className="space-y-2 flex flex-col items-center">
                <div className="w-full">
                  <p className="text-body-sm uppercase font-mono text-muted">Dein Standort</p>
                  <div className="rounded-2xl bg-white px-4 py-3 mt-2">
                    <p className="mt-1 font-medium">{formatDisplayAddress(resolvedAddress)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="mini"
                  onClick={() => {
                    setResolvedAddress(null)
                    setAnswerForQ(null)
                    updateLocation({ lat: 0, lng: 0, postal_code: null, city: null })
                  }}
                >
                  Standort erneut ermitteln
                </Button>
              </div>
              <LinkButton
                href={`/questionnaire/${questionnaireName}/${stepNumber + 1}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleManualAddress()
                }}
                size="sm"
                className="text-muted-foreground"
              >
                Adresse manuell eingeben
              </LinkButton>
            </div>
          )
        }
        return (
          <div className="space-y-6 flex flex-col items-center">
            <Button
              type="button"
              variant="white"
              size="lg"
              shape="round"
              onClick={handleGPSLocation}
              disabled={isGpsLoading}
              iconAfter={isGpsLoading ? null : 'locate'}
            >
              {isGpsLoading ? (
                <div className="flex flex-row items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Standort wird ermittelt...
                </div>
              ) : (
                <>
                  Standort ermitteln
                </>
              )}
            </Button>
            <div className="flex justify-center">
              <LinkButton
                href={`/questionnaire/${questionnaireName}/${stepNumber + 1}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleManualAddress()
                }}
                size="sm"
                className="text-muted-foreground"
              >
                Adresse manuell eingeben
              </LinkButton>
            </div>
          </div>
        )

      case 'plz':
        return (
          <InputOTP
            length={5}
            value={answer || ''}
            onChange={(val) => {
              setAnswerForQ(val)
              if (val.length === 5) {
                setError(
                  isValidColognePlz(val)
                    ? null
                    : 'Bitte geben Sie eine gültige Postleitzahl von Köln ein.',
                )
              } else {
                setError(null)
              }
            }}
            variant="plz"
            placeholderChar="0"
            shape="round"
          />
        )

      case 'address': {
        const mergedForPrefill = { ...state.answers, ...stepAnswers }
        const rawAddress = answer || {}
        const plzFromStep =
          state.location?.postal_code ??
          rawAddress.postal_code ??
          (() => {
            for (const v of Object.values(mergedForPrefill)) {
              if (typeof v === 'string' && isValidColognePlz(v)) return v
              if (
                v &&
                typeof v === 'object' &&
                'postal_code' in v &&
                typeof (v as any).postal_code === 'string' &&
                isValidColognePlz((v as any).postal_code)
              )
                return (v as any).postal_code
            }
            return undefined
          })()
        const addressAnswer = {
          street: rawAddress.street ?? '',
          housenumber: rawAddress.housenumber ?? '',
          postal_code: rawAddress.postal_code ?? plzFromStep ?? state.location?.postal_code ?? '',
          city: rawAddress.city ?? state.location?.city ?? 'Köln',
        }
        const postalCodeForFilter =
          state.location?.postal_code ?? (addressAnswer.postal_code || undefined)
        const setAddress = (val: Partial<typeof addressAnswer>) => {
          setAnswerForQ({ ...addressAnswer, ...val })
          setError(null)
        }
        return (
          <div className="space-y-4">
            <AddressSearchInput
              value={addressAnswer}
              onChange={setAddress}
              onError={setError}
              placeholder="STRASSE SUCHEN"
              postalCode={postalCodeForFilter}
            />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${question.key}-street`} className="uppercase text-muted-foreground">
                  Straße
                </Label>
                <Input
                  id={`${question.key}-street`}
                  autoComplete="address-line1"
                  value={addressAnswer.street}
                  onChange={(e) => setAddress({ street: e.target.value })}
                  placeholder="z. B. Mozartstraße"
                  className="font-body uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${question.key}-housenumber`} className="uppercase text-muted-foreground">
                  Hausnr.
                </Label>
                <Input
                  id={`${question.key}-housenumber`}
                  autoComplete="address-line2"
                  value={addressAnswer.housenumber}
                  onChange={(e) => setAddress({ housenumber: e.target.value })}
                  placeholder="z. B. 12"
                  className="font-body uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`${question.key}-plz`} className="uppercase text-muted-foreground">
                    PLZ
                  </Label>
                  <Input
                    id={`${question.key}-plz`}
                    autoComplete="postal-code"
                    value={addressAnswer.postal_code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 5)
                      setAddress({ postal_code: v })
                      if (v.length === 5) {
                        setError(isValidColognePlz(v) ? null : 'Bitte gültige Kölner PLZ eingeben.')
                      } else setError(null)
                    }}
                    placeholder="50667"
                    maxLength={5}
                    className="font-body"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${question.key}-city`} className="uppercase text-muted-foreground">
                    Stadt
                  </Label>
                  <Input
                    id={`${question.key}-city`}
                    autoComplete="address-level2"
                    value={addressAnswer.city}
                    onChange={(e) => setAddress({ city: e.target.value })}
                    placeholder="Köln"
                    className="font-body uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }

      case 'singleChoice':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <RadioCardGroup
            value={answer || ''}
            onValueChange={(value) => {
              setAnswerForQ(value)
              setError(null)
            }}
            name={question.key}
            className="grid grid-cols-2 gap-2"
          >
            {question.options.map((option, index) => {
              const text = `${option.value} ${option.label}`.toLowerCase()
              const icon =
                text.includes('haus') || text.includes('house') ? (
                  <Home className="h-5 w-5" />
                ) : text.includes('wohnung') || text.includes('apartment') ? (
                  <Building className="h-5 w-5" />
                ) : text.includes('citycenter') ? (
                  <Target className="h-5 w-5" />
                ) : text.includes('outskirts') ? (
                  <TreePine className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )
              return (
                <RadioCardItem key={index} value={option.value} label={option.label} icon={icon} />
              )
            })}
          </RadioCardGroup>
        )

      case 'radio':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={(value) => {
              setAnswerForQ(value)
              setError(null)
            }}
            name={question.key}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <label
                key={index}
                className="flex cursor-pointer items-center space-x-3 rounded-lg border bg-card p-4 hover:bg-muted"
                onClick={() => {
                  setAnswerForQ(option.value)
                  setError(null)
                }}
              >
                <RadioGroupItem value={option.value} />
                <span className="flex-1">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        )

      case 'multiChoice':
        if (!question.options || !Array.isArray(question.options)) return null
        const selectedValues = Array.isArray(answer) ? answer : []
        return (
          <div className="flex flex-wrap gap-1">
            {question.options.map((option, index) => (
              <Toggle
                key={index}
                pressed={selectedValues.includes(option.value)}
                onPressedChange={(pressed: boolean) => {
                  if (pressed) {
                    setAnswerForQ([...selectedValues, option.value])
                  } else {
                    setAnswerForQ(selectedValues.filter((v: string) => v !== option.value))
                  }
                  setError(null)
                }}
                aria-label={option.label}
              >
                {option.label}
              </Toggle>
            ))}
          </div>
        )

      case 'slider':
        const sliderConfig = question.sliderConfig
        const min = sliderConfig?.min || 0
        const max = sliderConfig?.max || 9
        const sliderValue = answer !== null && answer !== undefined ? answer : min

        return (
          <HeatIntensitySlider
            value={sliderValue}
            onChange={(value) => {
              setAnswerForQ(value)
              setError(null)
            }}
            min={min}
            max={max}
            required={question.required}
          />
        )

      case 'sliderHorizontalRange': {
        const rangeConfig = question.sliderConfig
        const rangeMin = rangeConfig?.min ?? 0
        const rangeMax = rangeConfig?.max ?? 100
        const rangeStep = rangeConfig?.step ?? 1
        const rangeUnit = rangeConfig?.unit
        const rangeValue: [number, number] =
          Array.isArray(answer) && answer.length === 2 && typeof answer[0] === 'number' && typeof answer[1] === 'number'
            ? [answer[0], answer[1]]
            : [rangeMin, rangeMax]

        return (
          <HorizontalRangeSlider
            value={rangeValue}
            onValueChange={(v) => {
              setAnswerForQ(v)
              setError(null)
            }}
            min={rangeMin}
            max={rangeMax}
            step={rangeStep}
            unit={rangeUnit}
          />
        )
      }

      case 'sliderVertical': {
        const vConfig = question.sliderVerticalConfig
        const vMin = vConfig?.min ?? 0
        const vMax = vConfig?.max ?? 10
        const vStep = vConfig?.step ?? 1
        const vLabelTop = vConfig?.labelTop ?? ''
        const vLabelBottom = vConfig?.labelBottom ?? ''
        const vValue =
          answer !== null && answer !== undefined && typeof answer === 'number' ? answer : vMin

        return (
          <VerticalSlider
            value={vValue}
            onValueChange={(v) => {
              setAnswerForQ(v)
              setError(null)
            }}
            min={vMin}
            max={vMax}
            step={vStep}
            labelTop={vLabelTop}
            labelBottom={vLabelBottom}
          />
        )
      }

      case 'text':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => {
              setAnswerForQ(e.target.value)
              setError(null)
            }}
            placeholder="Ihre Antwort..."
            rows={4}
          />
        )

      case 'number': {
        const numConfig = question.numberConfig
        const min = numConfig?.min
        const max = numConfig?.max
        return (
          <Input
            type="number"
            value={answer !== null && answer !== undefined && answer !== '' ? String(answer) : ''}
            onChange={(e) => {
              const v = e.target.value
              if (v === '') {
                setAnswerForQ(null)
              } else {
                const n = Number(v)
                const clamped =
                  min != null && max != null
                    ? Math.min(Math.max(n, min), max)
                    : min != null
                      ? Math.max(n, min)
                      : max != null
                        ? Math.min(n, max)
                        : n
                setAnswerForQ(clamped)
              }
              setError(null)
            }}
            placeholder={numConfig?.placeholder ?? undefined}
            min={min}
            max={max}
            className="w-full"
          />
        )
      }

      case 'dropdown':
        if (!question.options?.length) return null
        return (
          <Select
            value={answer ?? ''}
            onValueChange={(value) => {
              setAnswerForQ(value)
              setError(null)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Bitte auswählen" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((opt, idx) => (
                <SelectItem key={idx} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'textarea': {
        const taConfig = question.textareaConfig
        const maxLen = taConfig?.maxLength ?? 2000
        const rows = taConfig?.rows ?? 4
        const len = String(answer ?? '').length
        return (
          <div className="space-y-2">
            <Textarea
              value={answer || ''}
              onChange={(e) => {
                const v = e.target.value
                if (v.length <= maxLen) setAnswerForQ(v)
                setError(null)
              }}
              placeholder="Ihre Antwort..."
              rows={rows}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Maximal {maxLen} Zeichen</span>
              <span className={len >= maxLen ? 'text-destructive' : ''}>{maxLen - len} verbleibend</span>
            </div>
          </div>
        )
      }

      case 'consent': {
        const consentConfig = question.consentConfig
        const consentText = consentConfig?.consentText ?? 'Ich stimme der Erhebung und Verarbeitung meiner Daten zu.'
        return (
          <div className="flex items-start space-x-3">
            <Checkbox
              id={`consent-${question.key}`}
              checked={answer === true}
              onCheckedChange={(checked) => {
                setAnswerForQ(checked === true)
                setError(null)
              }}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label htmlFor={`consent-${question.key}`} className="text-base font-medium leading-none cursor-pointer">
                {consentText}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
          </div>
        )
      }

      case 'iconSelection':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <IconSelection
            options={question.options}
            value={Array.isArray(answer) ? answer : []}
            onChange={(value) => {
              setAnswerForQ(value)
              setError(null)
            }}
            required={question.required}
          />
        )

      case 'group':
        if (!question.groupFields) return null
        return (
          <div className="space-y-6">
            {question.groupFields.map((subQ) => {
              const subAnswer = answer[subQ.key] || null

              return (
                <div key={subQ.id} className="space-y-3">
                  <Label>
                    {subQ.title}
                    {subQ.required && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                  {subQ.description && (
                    <p className="text-sm text-muted-foreground">{subQ.description}</p>
                  )}

                  {subQ.type === 'radio' && subQ.options && (
                    <RadioGroup
                      value={subAnswer || ''}
                      onValueChange={(value) => {
                        setAnswerForQ({ ...answer, [subQ.key]: value })
                        setError(null)
                      }}
                      name={subQ.key}
                      className="space-y-2"
                    >
                      {subQ.options.map((option, idx) => (
                        <label
                          key={idx}
                          className="flex cursor-pointer items-center space-x-3 rounded-lg border bg-card p-3 hover:bg-muted"
                          onClick={() => {
                            setAnswerForQ({ ...answer, [subQ.key]: option.value })
                            setError(null)
                          }}
                        >
                          <RadioGroupItem value={option.value} />
                          <span className="flex-1">{option.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  {subQ.type === 'text' && (
                    <Textarea
                      value={subAnswer || ''}
                      onChange={(e) => {
                        setAnswerForQ({ ...answer, [subQ.key]: e.target.value })
                        setError(null)
                      }}
                      placeholder="Ihre Antwort..."
                      rows={3}
                    />
                  )}

                  {subQ.type === 'plz' && (
                    <InputOTP
                      length={5}
                      value={subAnswer || ''}
                      onChange={(val) => {
                        setAnswerForQ({ ...answer, [subQ.key]: val })
                        if (val.length === 5) {
                          setError(
                            isValidColognePlz(val)
                              ? null
                              : 'Bitte geben Sie eine gültige Postleitzahl von Köln ein.',
                          )
                        } else {
                          setError(null)
                        }
                      }}
                      variant="plz"
                      placeholderChar="0"
                      shape="round"
                      size="default"
                    />
                  )}

                  {subQ.type === 'address' &&
                    (() => {
                      const addrAnswer = {
                        street: (subAnswer && subAnswer.street) ?? '',
                        housenumber: (subAnswer && subAnswer.housenumber) ?? '',
                        postal_code: (subAnswer && subAnswer.postal_code) ?? '',
                        city: (subAnswer && subAnswer.city) ?? 'Köln',
                      }
                      const plzFromGroup = question.groupFields?.find((f) => f.type === 'plz')
                      const groupPostalCode = plzFromGroup
                        ? String(answer[plzFromGroup.key] ?? '').trim()
                        : undefined
                      const postalCodeForFilter =
                        state.location?.postal_code ?? (groupPostalCode || addrAnswer.postal_code)
                      return (
                        <AddressSearchInput
                          value={addrAnswer}
                          onChange={(val) => {
                            setAnswerForQ({ ...answer, [subQ.key]: val })
                            setError(null)
                          }}
                          onError={setError}
                          placeholder="STRASSE SUCHEN"
                          postalCode={postalCodeForFilter || undefined}
                        />
                      )
                    })()}
                </div>
              )
            })}
          </div>
        )

      default:
        return <p className="text-muted-foreground">Unbekannter Fragetyp: {question.type}</p>
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pb-28 md:py-16 md:pb-28">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="alert"
            initial={{ x: '-50%', y: -100, opacity: 0 }}
            animate={{ x: '-50%', y: 0, opacity: 1 }}
            exit={{ x: '-50%', y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-1/2 w-full max-w-[560px] z-50 p-2"
          >
            <Alert variant="error" className="text-sm">
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (pendingPathRef.current) {
            router.push(pendingPathRef.current)
            pendingPathRef.current = null
          }
        }}
      >
        {!isExiting ? (
          <motion.div
            key={stepNumber}
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.46, 0.03, 0.52, 0.96] }}
          >
            <Card
              variant={sectionColors ? 'default' : 'purple'}
              className="h-[70lvh] mb-4 w-[calc(100vw-2rem-16px)]"
              style={
                sectionColors
                  ? { backgroundColor: sectionColors.cardBg, borderColor: sectionColors.cardProgress }
                  : undefined
              }
            >
              <div className="space-y-6 overflow-y-auto h-full">
                <div className="px-6 py-8 space-y-8">
                  {(stepTitle || stepDescription) && (
                    <div>
                      {stepTitle && (
                        <h1 className="mb-2 text-h5 font-headings font-semibold uppercase">
                          {stepTitle}
                        </h1>
                      )}
                      {stepDescription && (
                        <p className="text-body-sm text-muted-foreground">{stepDescription}</p>
                      )}
                    </div>
                  )}
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className={cn(
                        'space-y-3',
                        q.type === 'sliderHorizontalRange' && 'flex flex-col min-h-[55lvh]',
                      )}
                    >
                      {(!stepTitle || questions.length > 1) && (
                        <div>
                          <h2 className="text-base font-semibold uppercase">{q.title}</h2>
                          {q.description && (
                            <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                          )}
                        </div>
                      )}
                      <div className={q.type === 'sliderHorizontalRange' ? 'flex flex-1 min-h-0 flex-col' : undefined}>
                        {renderQuestionInput(q, getAnswer(q.key), (v) => setAnswer(q.key, v))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="exiting" className="mb-4 h-[70lvh] w-full flex-shrink-0" aria-hidden />
        )}
      </AnimatePresence>

      <div className="fixed right-2 top-20 flex h-[70lvh] min-h-0 flex-shrink-0 flex-col py-2">
        <PaginationSteps
          currentStep={sectionStepsTotal != null && sectionStepNumber != null ? sectionStepNumber : stepNumber}
          totalSteps={sectionStepsTotal ?? totalSteps}
          direction="vertical"
          progressColor={sectionColors?.cardProgress}
          onStepClick={(step) => {
            const targetFlat =
              sectionStepsTotal != null && sectionStepNumber != null
                ? stepNumber - sectionStepNumber + step
                : step
            pendingPathRef.current = `/questionnaire/${questionnaireName}/${targetFlat}`
            setIsExiting(true)
          }}
        />
      </div>

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        nextLabel={
          isLastStepWithConsent ? (isSubmitting ? 'Wird gespeichert...' : 'Absenden') : nextButtonText
        }
        nextDisabled={isWeiterDisabled() || isSubmitting}
        nextIcon={isLastStepWithConsent ? 'check' : stepNumber < totalSteps ? 'arrow-down' : 'check'}
        onAbort={handleAbortQuestionnaire}
        showAbortDialog={showAbortDialog}
        setShowAbortDialog={setShowAbortDialog}
        onConfirmAbort={handleConfirmAbort}
      />
    </div>
  )
}
