'use client'

import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio'
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card'
import { Textarea } from '@/components/ui/textarea'
import { InputOTP } from '@/components/ui/input-otp'
import HeatIntensitySlider from '@/components/questionnaire/HeatIntensitySlider'
import IconSelection from '@/components/questionnaire/IconSelection'
import { AddressSearchInput } from '@/components/questionnaire/AddressSearchInput'
import QuestionnaireNav from '@/components/questionnaire/QuestionnaireNav'
import { LinkButton } from '@/components/ui/link-button'
import { useSubmission } from '@/providers/Submission'
import { useQuestionnaireNavigation } from '../../useQuestionnaireNavigation'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

import type { Question } from '../../questions'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

import { Home, Building, Plus, Target, TreePine } from 'lucide-react'
import { isValidColognePlz } from '@/utilities/colognePlz'
import PaginationSteps from '@/components/questionnaire/PaginationSteps'

type QuestionClientProps = {
  questionnaireName: string
  question: Question
  stepNumber: number
  totalSteps: number
  /** Used to skip plz/address steps when user located via GPS */
  questionTypes: Question['type'][]
  nextButtonText: string
  previousButtonText: string
}

const STEPS_TO_SKIP_WHEN_GPS = ['plz', 'address'] as const

export default function QuestionClient({
  questionnaireName,
  question,
  stepNumber,
  totalSteps,
  questionTypes,
  nextButtonText,
  previousButtonText,
}: QuestionClientProps) {
  const router = useRouter()
  const { state, updateAnswer, updateAnswers, updateCurrentStep, updateLocation } = useSubmission()

  // For group questions, store answers as an object
  // For regular questions, store as single value
  const getInitialAnswer = () => {
    if (question.type === 'group') {
      const groupAnswer: Record<string, any> = {}
      if (question.groupFields) {
        question.groupFields.forEach((subQ) => {
          groupAnswer[subQ.key] = state.answers[subQ.key] || null
        })
      }
      return groupAnswer
    }
    return state.answers[question.key] || null
  }

  const [answer, setAnswer] = useState<any>(getInitialAnswer())
  const [error, setError] = useState<string | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const pendingPathRef = useRef<string | null>(null)
  const [isGpsLoading, setIsGpsLoading] = useState(false)
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

  // Sync resolvedAddress from state when user navigates back with existing location
  useEffect(() => {
    if (
      question.type === 'location_GPS' &&
      !resolvedAddress &&
      state.location?.postal_code &&
      state.answers[question.key] === 'gps'
    ) {
      const loc = state.location
      setResolvedAddress({
        postal_code: loc.postal_code!,
        city: loc.city,
        street: loc.street || null,
        house_number: null,
      })
    }
  }, [question.type, question.key, state.location, state.answers, resolvedAddress])

  // Skip plz/address when user already used GPS (e.g. direct link or back from later step)
  useEffect(() => {
    if (!state.location?.postal_code) return
    if (!STEPS_TO_SKIP_WHEN_GPS.includes(question.type as (typeof STEPS_TO_SKIP_WHEN_GPS)[number]))
      return
    let nextStep = stepNumber
    while (
      nextStep <= totalSteps &&
      STEPS_TO_SKIP_WHEN_GPS.includes(
        questionTypes[nextStep - 1] as (typeof STEPS_TO_SKIP_WHEN_GPS)[number],
      )
    ) {
      nextStep++
    }
    if (nextStep <= totalSteps) {
      router.replace(`/questionnaire/${questionnaireName}/${nextStep}`)
    } else {
      router.replace('/feedback')
    }
  }, [
    questionnaireName,
    question.type,
    stepNumber,
    totalSteps,
    questionTypes,
    state.location?.postal_code,
    router,
  ])

  // Initialize slider with default value if required and not set
  useEffect(() => {
    if (
      question.type === 'slider' &&
      question.required &&
      (answer === null || answer === undefined)
    ) {
      const sliderConfig = question.sliderConfig
      const min = sliderConfig?.min || 0
      setAnswer(min)
    }
  }, [question.type, question.required, question.sliderConfig])

  const isWeiterDisabled = (): boolean => {
    if (question.type === 'location_GPS') return !resolvedAddress
    if (question.type === 'plz') {
      const plz = String(answer ?? '').trim()
      return plz.length !== 5 || !isValidColognePlz(plz)
    }
    if (question.type === 'singleChoice') {
      return answer == null || answer === ''
    }
    if (question.type === 'group' && question.groupFields) {
      for (const subQ of question.groupFields) {
        if (subQ.required && subQ.type === 'plz') {
          const plz = String(answer?.[subQ.key] ?? '').trim()
          if (plz.length !== 5 || !isValidColognePlz(plz)) return true
        }
      }
    }
    return false
  }

  const validateAnswer = (): boolean => {
    if (!question.required) return true

    if (question.type === 'group') {
      // Validate all required sub-questions
      if (!question.groupFields) return true
      for (const subQ of question.groupFields) {
        if (subQ.required) {
          const subAnswer = answer[subQ.key]
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
    } else if (question.type === 'address') {
      if (!answer || !answer.street || answer.street.trim() === '') {
        setError('Bitte geben Sie eine Straße ein.')
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
    } else {
      if (!answer || answer === '') {
        setError('Bitte beantworten Sie diese Frage.')
        return false
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
    questionTypes,
    question,
    answer,
    state,
    updateAnswer,
    updateCurrentStep,
    validateAnswer,
    onBeforeNextNavigate: (path) => {
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
              updateAnswer(question.key, 'gps')
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
      updateAnswer(question.key, 'gps')
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
    updateAnswer(question.key, 'manual')
    updateLocation({ lat: 0, lng: 0, postal_code: null, city: null })
    updateCurrentStep('questionnaire')
    if (stepNumber < totalSteps) {
      router.push(`/questionnaire/${questionnaireName}/${stepNumber + 1}`)
    } else {
      router.push('/feedback')
    }
  }

  const renderQuestionInput = () => {
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
                    setAnswer(null)
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
                  {/* <MapPin className="mr-2 h-4 w-4" /> */}
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
              setAnswer(val)
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
        const addressAnswer = answer || { street: '', postal_code: '' }
        const postalCodeForFilter =
          state.location?.postal_code ??
          addressAnswer.postal_code ??
          (() => {
            for (const v of Object.values(state.answers || {})) {
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
        return (
          <AddressSearchInput
            value={addressAnswer}
            onChange={(val) => {
              setAnswer(val)
              setError(null)
            }}
            onError={setError}
            placeholder="STRASSE SUCHEN"
            postalCode={postalCodeForFilter}
          />
        )
      }

      case 'singleChoice':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <RadioCardGroup
            value={answer || ''}
            onValueChange={(value) => {
              setAnswer(value)
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
              setAnswer(value)
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
                  setAnswer(option.value)
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
                    setAnswer([...selectedValues, option.value])
                  } else {
                    setAnswer(selectedValues.filter((v: string) => v !== option.value))
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
              setAnswer(value)
              setError(null)
            }}
            min={min}
            max={max}
            required={question.required}
          />
        )

      case 'text':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => {
              setAnswer(e.target.value)
              setError(null)
            }}
            placeholder="Ihre Antwort..."
            rows={4}
          />
        )

      case 'iconSelection':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <IconSelection
            options={question.options}
            value={Array.isArray(answer) ? answer : []}
            onChange={(value) => {
              setAnswer(value)
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
                        setAnswer({ ...answer, [subQ.key]: value })
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
                            setAnswer({ ...answer, [subQ.key]: option.value })
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
                        setAnswer({ ...answer, [subQ.key]: e.target.value })
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
                        setAnswer({ ...answer, [subQ.key]: val })
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
                      const addrAnswer = subAnswer || { street: '', postal_code: '' }
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
                            setAnswer({ ...answer, [subQ.key]: val })
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
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
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
            <Card variant="purple" className="h-[70lvh] mb-4 w-[calc(100vw-2rem-16px)]">
              <div className="space-y-6">
                {/* Question */}
                <div className="px-6 py-8 space-y-6">
                  <div>
                    <h1 className="mb-2 text-h5 font-headings font-semibold uppercase">
                      {question.title}
                    </h1>
                    {question.description && (
                      <p className="text-body-sm text-muted-foreground">{question.description}</p>
                    )}
                    {question.required && (
                      <p className="mt-2 text-sm text-muted-foreground">* Pflichtfeld</p>
                    )}
                  </div>

                  <div>{renderQuestionInput()}</div>
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
          currentStep={stepNumber}
          totalSteps={totalSteps}
          direction="vertical"
          onStepClick={(step) => {
            pendingPathRef.current = `/questionnaire/${questionnaireName}/${step}`
            setIsExiting(true)
          }}
        />
      </div>

      <QuestionnaireNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        nextLabel={stepNumber === totalSteps ? 'Weiter' : nextButtonText}
        nextDisabled={isWeiterDisabled()}
        nextIcon={stepNumber < totalSteps ? 'arrow-down' : 'check'}
        onAbort={handleAbortQuestionnaire}
        showAbortDialog={showAbortDialog}
        setShowAbortDialog={setShowAbortDialog}
        onConfirmAbort={handleConfirmAbort}
      />
    </div>
  )
}
