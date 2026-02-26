'use client'

import { cn } from '@/utilities/ui'
import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
import { useSubmission } from '@/providers/Submission'
import { useQuestionnaireNavigation } from '../../useQuestionnaireNavigation'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Question } from '../../questions'
import { Card, type CardProps } from '@/components/ui/card'
import { QuestionCaseInput, type QuestionCaseInputContext } from './QuestionCaseInput'
import {
  STEPS_TO_SKIP_WHEN_GPS,
  getInitialStepAnswers,
  formatDisplayAddress,
  isWeiterDisabled,
  validateAllQuestions,
  type ResolvedAddress,
} from './questionClientUtils'
import PaginationSteps, {
  type PaginationStepsProps,
} from '@/components/questionnaire/PaginationSteps'
import {
  useQuestionnaireProgress,
  useSetQuestionnaireProgress,
} from '../../QuestionnaireProgressContext'

export type ConditionalStepConfig = {
  parentQuestionKey: string
  conditions: { showWhenAnswerValue: string; question: Question }[]
}

type QuestionClientProps = {
  questionnaireName: string
  questions: Question[]
  /** Legacy: main question count. With single question per step this is unused. */
  mainQuestionCount?: number
  stepNumber: number
  totalSteps: number
  /** Used to skip plz/address steps when user located via GPS */
  questionTypes: Question['type'][]
  /** Flat list of question types per step (index = stepNumber - 1). Enables skipping multiple steps in one navigation after GPS. */
  allStepQuestionTypes?: Question['type'][][]
  nextButtonText: string
  previousButtonText: string
  /** Section theme (Tailwind classes for card and progress). When set, overrides default purple. */
  colorSection?: string
  /** When set, progress bar is section-scoped (only steps in this section) and only shown on step pages. */
  sectionStepsTotal?: number
  sectionStepNumber?: number
  /** When set, section-based progress bar is shown (section numbers, expanded current / compressed others). */
  sectionsProgress?: { stepsCount: number; progressClass?: string }[]
  currentSectionIndex?: number
  /** When set, this step shows the conditional question that matches the parent step answer; question list is resolved on client. */
  conditionalStepConfig?: ConditionalStepConfig
}

export default function QuestionClient({
  questionnaireName,
  questions,
  mainQuestionCount,
  stepNumber,
  totalSteps,
  questionTypes,
  allStepQuestionTypes,
  nextButtonText,
  colorSection,
  sectionStepsTotal,
  sectionStepNumber,
  sectionsProgress,
  currentSectionIndex,
  conditionalStepConfig,
}: QuestionClientProps) {
  const router = useRouter()
  const {
    state,
    updateAnswer,
    updateCurrentStep,
    updateLocation,
    updateUserText,
    updateConsent,
    updateResults,
  } = useSubmission()

  const resolvedConditionalQuestions = useMemo(() => {
    if (!conditionalStepConfig) return null
    const parentAnswer = state.answers[conditionalStepConfig.parentQuestionKey]
    const value = parentAnswer != null ? String(parentAnswer) : ''
    const match = conditionalStepConfig.conditions.find((c) => c.showWhenAnswerValue === value)
    return match ? [match.question] : []
  }, [conditionalStepConfig, state.answers])

  const effectiveQuestions =
    conditionalStepConfig && resolvedConditionalQuestions
      ? resolvedConditionalQuestions.length > 0
        ? resolvedConditionalQuestions
        : []
      : questions

  const effectiveQuestionTypes = effectiveQuestions.map((q) => q.type)

  const [stepAnswers, setStepAnswers] = useState<Record<string, any>>(() =>
    getInitialStepAnswers(questions, state.answers),
  )
  const conditionalSyncedRef = useRef(false)
  useEffect(() => {
    if (conditionalStepConfig && effectiveQuestions.length > 0 && !conditionalSyncedRef.current) {
      setStepAnswers((prev) => ({
        ...prev,
        ...getInitialStepAnswers(effectiveQuestions, state.answers),
      }))
      conditionalSyncedRef.current = true
    }
  }, [conditionalStepConfig, effectiveQuestions, state.answers])
  const setAnswer = (key: string, value: any) => {
    setStepAnswers((prev) => ({ ...prev, [key]: value }))
  }
  const getAnswer = (key: string) => stepAnswers[key] ?? null
  const setQuestionnaireError = useQuestionnaireProgress()?.setQuestionnaireError ?? (() => {})
  const [isExiting, setIsExiting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pendingPathRef = useRef<string | null>(null)
  const [isGpsLoading, setIsGpsLoading] = useState(false)
  const isLastStepWithConsent =
    stepNumber === totalSteps && effectiveQuestions.some((q) => q.type === 'consent')

  // When conditional step has no matching condition, skip to next step
  useEffect(() => {
    if (!conditionalStepConfig) return
    if ((resolvedConditionalQuestions?.length ?? 0) > 0) return
    const nextPath =
      stepNumber < totalSteps
        ? `/questionnaire/${questionnaireName}/${stepNumber + 1}`
        : '/feedback'
    router.replace(nextPath)
  }, [
    conditionalStepConfig,
    resolvedConditionalQuestions?.length,
    stepNumber,
    totalSteps,
    questionnaireName,
    router,
  ])
  const resultsRoute = '/results'
  const feedbackRoute = '/feedback'

  const onStepClickSection = useCallback(
    (step: number) => {
      const targetFlat =
        sectionStepsTotal != null && sectionStepNumber != null
          ? stepNumber - sectionStepNumber + step
          : step
      pendingPathRef.current = `/questionnaire/${questionnaireName}/${targetFlat}`
      setIsExiting(true)
    },
    [questionnaireName, stepNumber, sectionStepNumber, sectionStepsTotal],
  )

  const isSkippableStep =
    Boolean(state.location?.postal_code) &&
    effectiveQuestions.length > 0 &&
    effectiveQuestions.every((q) =>
      STEPS_TO_SKIP_WHEN_GPS.includes(q.type as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]),
    )

  const sectionProgressState = useMemo(() => {
    if (
      sectionsProgress == null ||
      sectionsProgress.length === 0 ||
      currentSectionIndex == null ||
      sectionStepsTotal == null ||
      sectionStepNumber == null
    ) {
      return null
    }
    return {
      sections: sectionsProgress,
      currentSectionIndex,
      currentStepInSection: sectionStepNumber,
      variant: (colorSection ?? 'purple') as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise',
      onStepClick: onStepClickSection,
    }
  }, [
    sectionsProgress,
    currentSectionIndex,
    sectionStepNumber,
    sectionStepsTotal,
    colorSection,
    onStepClickSection,
  ])
  useSetQuestionnaireProgress(sectionProgressState)

  const submitFromLastStep = useCallback(
    async (mergedAnswersOverride?: Record<string, any>) => {
      setIsSubmitting(true)
      setQuestionnaireError(null)
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

      const freeTextQuestion = effectiveQuestions.find((q) => q.type === 'textarea')
      const freeText = freeTextQuestion
        ? String(mergedAnswers[freeTextQuestion.key] ?? '').trim() || undefined
        : state.userText || undefined
      const personalFields = {
        ...state.personalFields,
        age: mergedAnswers.age ?? state.personalFields?.age ?? undefined,
        gender: mergedAnswers.gender ?? state.personalFields?.gender ?? undefined,
        householdSize:
          mergedAnswers.householdSize ?? state.personalFields?.householdSize ?? undefined,
      }

      try {
        if (!mergedLocation?.postal_code) {
          throw new Error('Standort fehlt. Bitte kehre zur Standortseite zurück.')
        }
        if (Object.keys(mergedAnswers).length === 0) {
          throw new Error('Keine Antworten gefunden. Bitte beantworte die Fragen.')
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
        setQuestionnaireError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      state.answers,
      state.location,
      state.personalFields,
      state.questionnaireVersion,
      state.userText,
      stepAnswers,
      stepNumber,
      totalSteps,
      effectiveQuestions,
      updateConsent,
      updateResults,
      updateUserText,
      updateCurrentStep,
      router,
    ],
  )

  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null)

  const locationQuestion = effectiveQuestions.find((q) => q.type === 'location_GPS')

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

  // Skip plz/address when user already used GPS (whole step is skippable). Skip all consecutive skippable steps in one go when we have allStepQuestionTypes.
  useEffect(() => {
    if (!state.location?.postal_code) return
    if (
      !effectiveQuestions.every((q) =>
        STEPS_TO_SKIP_WHEN_GPS.includes(q.type as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]),
      )
    )
      return
    let targetStep = stepNumber + 1
    if (allStepQuestionTypes && allStepQuestionTypes.length >= totalSteps) {
      while (
        targetStep <= totalSteps &&
        (allStepQuestionTypes[targetStep - 1] ?? []).every((t) =>
          STEPS_TO_SKIP_WHEN_GPS.includes(t as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]),
        )
      ) {
        targetStep++
      }
    }
    if (targetStep <= totalSteps) {
      router.replace(`/questionnaire/${questionnaireName}/${targetStep}`)
    } else {
      router.replace('/feedback')
    }
  }, [
    questionnaireName,
    stepNumber,
    totalSteps,
    effectiveQuestions,
    state.location?.postal_code,
    router,
    allStepQuestionTypes,
  ])

  // Initialize slider default for any slider question in step
  useEffect(() => {
    for (const q of effectiveQuestions) {
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
        const max = q.sliderVerticalConfig?.max ?? 10
        const step = q.sliderVerticalConfig?.step ?? 1
        const middle = min + Math.round((max - min) / (2 * step)) * step
        setAnswer(q.key, middle)
      }
    }
  }, [])

  const validateAnswer = async (): Promise<boolean> => {
    const result = validateAllQuestions(effectiveQuestions, stepAnswers, state.location)
    if (!result.valid) {
      setQuestionnaireError(result.error)
      return false
    }
    const addressQuestion = effectiveQuestions.find((q) => q.type === 'address')
    if (addressQuestion) {
      const raw = stepAnswers[addressQuestion.key]
      const addr =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as { street?: string; housenumber?: string; postal_code?: string })
          : null
      const street = addr?.street?.trim()
      const postal_code = addr?.postal_code?.trim()
      if (street && postal_code && postal_code.length === 5) {
        const housenumber = addr?.housenumber?.trim() ?? ''
        try {
          const res = await fetch('/api/validate-address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ street, housenumber, postal_code }),
          })
          const data = (await res.json()) as { valid?: boolean; error?: string }
          if (!data.valid) {
            setQuestionnaireError(data.error ?? 'Adresse konnte nicht geprüft werden.')
            return false
          }
        } catch {
          setQuestionnaireError(
            'Adressprüfung ist derzeit nicht möglich. Bitte versuche es später erneut.',
          )
          return false
        }
      }
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
    questionTypes: effectiveQuestionTypes,
    allStepQuestionTypes,
    questions: effectiveQuestions,
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
    setQuestionnaireError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von Deinem Browser nicht unterstützt.')
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
            'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut oder verwende die manuelle Eingabe.',
          )
        }
        throw new Error(
          errorData.error || 'Geocodierung fehlgeschlagen. Bitte verwende die manuelle Eingabe.',
        )
      }

      const data = await response.json()

      if (!data.postal_code) {
        throw new Error(
          'Postleitzahl konnte nicht ermittelt werden. Bitte verwende die manuelle Eingabe.',
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
        setQuestionnaireError(
          'Standortzugriff wurde verweigert. Bitte erlaube den Standortzugriff in Deinen Browsereinstellungen oder verwende die manuelle Eingabe.',
        )
      } else if (e.code === 2) {
        setQuestionnaireError(
          'Standort konnte nicht ermittelt werden. Bitte überprüfe Deine GPS-Einstellungen oder verwende die manuelle Eingabe.',
        )
      } else if (e.code === 3 || e.message === 'Timeout') {
        setQuestionnaireError(
          'Zeitüberschreitung bei der Standortermittlung. Bitte versuche es erneut oder verwende die manuelle Eingabe.',
        )
      } else {
        setQuestionnaireError(
          e.message || 'Fehler bei der Standortermittlung. Bitte verwende die manuelle Eingabe.',
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

  const questionInputContext: QuestionCaseInputContext = {
    state,
    stepAnswers,
    setError: setQuestionnaireError,
    questionnaireName,
    stepNumber,
    totalSteps,
    updateLocation,
    updateAnswer,
    resolvedAddress,
    setResolvedAddress,
    formatDisplayAddress,
    onGPSLocation: handleGPSLocation,
    onManualAddress: handleManualAddress,
    isGpsLoading,
  }

  if (conditionalStepConfig && effectiveQuestions.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex min-h-0 h-full max-h-full flex-col mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg pl-4 pr-10 py-8 pb-28 md:px-4 md:py-16 md:pb-28">
        <AnimatePresence
          mode="wait"
          onExitComplete={() => {
            if (pendingPathRef.current) {
              router.push(pendingPathRef.current)
              pendingPathRef.current = null
            }
          }}
        >
          {!isExiting && !isSkippableStep ? (
            <motion.div
              key={stepNumber}
              className="flex min-h-0 flex-1 flex-col"
              initial={{ y: 48, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -80, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.46, 0.03, 0.52, 0.96] }}
            >
              <Card
                variant={(colorSection ?? 'purple') as CardProps['variant']}
                className="flex min-h-0 h-[70vh] flex-col overflow-hidden"
              >
                <div className="relative min-h-0 flex-1 space-y-6 overflow-y-auto">
                  <div className="px-6 py-8 space-y-8">
                    {effectiveQuestions[0]?.title != null && (
                      <div>
                        <h1 className="mb-2 text-h5 font-headings font-semibold uppercase">
                          {effectiveQuestions[0].title}
                        </h1>
                        {effectiveQuestions[0].description != null && (
                          <p className="text-body-sm text-muted-foreground">
                            {effectiveQuestions[0].description}
                          </p>
                        )}
                      </div>
                    )}
                    {effectiveQuestions.map((q) => (
                      <div
                        key={q.id}
                        className={cn(
                          'space-y-3',
                          q.type === 'sliderHorizontalRange' && 'flex flex-col min-h-[55lvh]',
                        )}
                      >
                        <div
                          className={
                            q.type === 'sliderHorizontalRange'
                              ? 'relative flex flex-1 min-h-0 flex-col'
                              : undefined
                          }
                        >
                          <QuestionCaseInput
                            question={q}
                            answer={getAnswer(q.key)}
                            setAnswer={(v) => setAnswer(q.key, v)}
                            context={questionInputContext}
                            color={
                              colorSection as 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : !isExiting && isSkippableStep ? (
            <div
              key="skipping"
              className="min-h-0 flex-1 flex-shrink-0 flex items-center justify-center text-muted-foreground text-sm"
              aria-live="polite"
            >
              Weiterleitung…
            </div>
          ) : (
            <motion.div key="exiting" className="min-h-0 flex-1 flex-shrink-0" aria-hidden />
          )}
        </AnimatePresence>
      </div>

      {/* Section progress bar is rendered by [step] layout so it stays mounted and can animate. Legacy (no sections) uses PaginationSteps below. */}
      {sectionProgressState == null && (
        <div className="fixed right-4 top-20 z-10 flex h-[70lvh] max-h-[calc(100vh-6rem)] min-h-0 flex-col py-2 md:right-6">
          <PaginationSteps
            currentStep={
              sectionStepsTotal != null && sectionStepNumber != null
                ? sectionStepNumber
                : stepNumber
            }
            totalSteps={sectionStepsTotal ?? totalSteps}
            direction="vertical"
            variant={(colorSection ?? 'purple') as PaginationStepsProps['variant']}
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
      )}

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        nextLabel={
          isLastStepWithConsent
            ? isSubmitting
              ? 'Wird gespeichert...'
              : 'Absenden'
            : effectiveQuestions.some((q) => q.required)
              ? nextButtonText
              : 'Überspringen'
        }
        nextDisabled={
          isWeiterDisabled(effectiveQuestions, stepAnswers, resolvedAddress) || isSubmitting
        }
        nextIcon={
          isLastStepWithConsent ? 'check' : stepNumber < totalSteps ? 'arrow-down' : 'check'
        }
        onAbort={handleAbortQuestionnaire}
        showAbortDialog={showAbortDialog}
        setShowAbortDialog={setShowAbortDialog}
        onConfirmAbort={handleConfirmAbort}
      />
    </>
  )
}
