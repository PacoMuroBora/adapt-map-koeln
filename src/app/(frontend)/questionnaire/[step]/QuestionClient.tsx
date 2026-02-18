'use client'

import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import HeatIntensitySlider from '@/components/questionnaire/HeatIntensitySlider'
import IconSelection from '@/components/questionnaire/IconSelection'
import ProgressBar from '@/components/questionnaire/ProgressBar'
import { LinkButton } from '@/components/ui/link-button'
import { useSubmission } from '@/providers/Submission'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import React, { useEffect, useState } from 'react'
import { STEP_QUESTIONNAIRE_START, TOTAL_STEPS } from '../constants'

import type { Question } from '../questions'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

type QuestionClientProps = {
  question: Question
  stepNumber: number
  totalSteps: number
  nextButtonText: string
  previousButtonText: string
}

export default function QuestionClient({
  question,
  stepNumber,
  totalSteps,
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
  const [isGpsLoading, setIsGpsLoading] = useState(false)

  // Auto-dismiss error alert after 500ms
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 2500)
    return () => clearTimeout(timer)
  }, [error])

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

  // Calculate actual step number in overall flow (questionnaire starts at STEP_QUESTIONNAIRE_START)
  const actualStepNumber = STEP_QUESTIONNAIRE_START + stepNumber - 1

  const validateAnswer = (): boolean => {
    if (!question.required) return true

    if (question.type === 'group') {
      // Validate all required sub-questions
      if (!question.groupFields) return true
      for (const subQ of question.groupFields) {
        if (subQ.required) {
          const subAnswer = answer[subQ.key]
          if (subQ.type === 'text' || subQ.type === 'plz') {
            if (!subAnswer || String(subAnswer).trim() === '') {
              setError(`Bitte beantworten Sie: ${subQ.title}`)
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
    } else if (question.type === 'plz') {
      if (!answer || String(answer).trim() === '') {
        setError('Bitte geben Sie eine Postleitzahl ein.')
        return false
      }
    } else if (question.type === 'checkbox') {
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

  const handleNext = () => {
    if (!validateAnswer()) {
      return
    }

    // Save answers
    if (question.type === 'group' && question.groupFields) {
      // Save each sub-question answer individually
      question.groupFields.forEach((subQ) => {
        updateAnswer(subQ.key, answer[subQ.key])
      })
    } else {
      updateAnswer(question.key, answer)
    }

    updateCurrentStep('questionnaire')

    if (stepNumber < totalSteps) {
      router.push(`/questionnaire/${stepNumber + 1}`)
    } else {
      router.push('/feedback')
    }
  }

  const handlePrevious = () => {
    // Save answers before going back
    if (question.type === 'group' && question.groupFields) {
      question.groupFields.forEach((subQ) => {
        updateAnswer(subQ.key, answer[subQ.key])
      })
    } else {
      updateAnswer(question.key, answer)
    }

    if (stepNumber > 1) {
      router.push(`/questionnaire/${stepNumber - 1}`)
    } else {
      router.push('/personal')
    }
  }

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
              updateLocation({
                lat: cached.lat,
                lng: cached.lng,
                postal_code: data.postal_code,
                city: data.city,
                street: data.street || undefined,
              })
              updateCurrentStep('questionnaire')
              if (stepNumber < totalSteps) {
                router.push(`/questionnaire/${stepNumber + 1}`)
              } else {
                router.push('/feedback')
              }
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

      updateLocation({
        lat: latitude,
        lng: longitude,
        postal_code: data.postal_code,
        city: data.city,
        street: data.street || undefined,
      })

      updateCurrentStep('questionnaire')
      if (stepNumber < totalSteps) {
        router.push(`/questionnaire/${stepNumber + 1}`)
      } else {
        router.push('/feedback')
      }
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
    updateCurrentStep('questionnaire')
    if (stepNumber < totalSteps) {
      router.push(`/questionnaire/${stepNumber + 1}`)
    } else {
      router.push('/feedback')
    }
  }

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'location_GPS':
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
                href={`/questionnaire/${stepNumber + 1}`}
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
          <Input
            value={answer || ''}
            onChange={(e) => {
              setAnswer(e.target.value)
              setError(null)
            }}
            placeholder="z.B. 50667"
            inputMode="numeric"
            maxLength={5}
          />
        )

      case 'address':
        const addressAnswer = answer || { street: '', postal_code: '' }
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">
                Straße {question.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="street"
                value={addressAnswer.street || ''}
                onChange={(e) => {
                  setAnswer({ ...addressAnswer, street: e.target.value })
                  setError(null)
                }}
                placeholder="z.B. Musterstraße 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postleitzahl (optional)</Label>
              <Input
                id="postal_code"
                value={addressAnswer.postal_code || ''}
                onChange={(e) => {
                  setAnswer({ ...addressAnswer, postal_code: e.target.value })
                  setError(null)
                }}
                placeholder="z.B. 50667"
              />
            </div>
          </div>
        )

      case 'select':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <Select
            value={answer || ''}
            onValueChange={(value) => {
              setAnswer(value)
              setError(null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Bitte auswählen" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      case 'checkbox':
        if (!question.options || !Array.isArray(question.options)) return null
        const selectedValues = Array.isArray(answer) ? answer : []
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className="flex cursor-pointer items-center space-x-3 rounded-lg border bg-card p-4 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAnswer([...selectedValues, option.value])
                    } else {
                      setAnswer(selectedValues.filter((v: string) => v !== option.value))
                    }
                    setError(null)
                  }}
                />
                <span className="flex-1">{option.label}</span>
              </label>
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
                    <Input
                      value={subAnswer || ''}
                      onChange={(e) => {
                        setAnswer({ ...answer, [subQ.key]: e.target.value })
                        setError(null)
                      }}
                      placeholder="z.B. 50667"
                      inputMode="numeric"
                      maxLength={5}
                    />
                  )}
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
      <Card variant="purple" className="h-[70lvh]">
        <div className="space-y-6">
          {/* Progress bar */}
          {/* <ProgressBar currentStep={actualStepNumber} totalSteps={TOTAL_STEPS} /> */}

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
      {/* Navigation */}
      <div className="relative flex flex-row items-center gap-4 h-14 mt-4">
        <Button
          type="button"
          variant="outline-white"
          onClick={handlePrevious}
          iconBefore="arrow-up"
        />
        <Button
          type="button"
          size="lg"
          shape="round"
          variant="white"
          iconAfter={stepNumber < totalSteps ? 'arrow-down' : 'check'}
          onClick={handleNext}
          className={cn(
            'absolute left-1/2 -translate-x-1/2',
            question.type === 'location_GPS' ? 'opacity-20' : '',
          )}
        >
          {stepNumber === totalSteps ? 'Weiter' : nextButtonText}
        </Button>
      </div>
    </div>
  )
}
