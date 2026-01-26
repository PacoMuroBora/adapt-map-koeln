'use client'

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
import { useSubmission } from '@/providers/Submission'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { STEP_QUESTIONNAIRE_START, TOTAL_STEPS } from '../constants'

import type { Question } from '../questions'

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
  const { state, updateAnswer, updateAnswers, updateCurrentStep } = useSubmission()
  
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
          if (subQ.type === 'text') {
            if (!subAnswer || subAnswer.trim() === '') {
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

  const renderQuestionInput = () => {
    switch (question.type) {
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
      <div className="space-y-6">
        {/* Progress bar */}
        <ProgressBar currentStep={actualStepNumber} totalSteps={TOTAL_STEPS} />

        {/* Question */}
        <div className="space-y-4">
          <div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{question.title}</h1>
            {question.description && (
              <p className="text-muted-foreground">{question.description}</p>
            )}
            {question.required && (
              <p className="mt-2 text-sm text-muted-foreground">* Pflichtfeld</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="rounded-lg border bg-card p-6">{renderQuestionInput()}</div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {previousButtonText}
          </Button>
          <Button type="button" onClick={handleNext} className="w-full sm:w-auto sm:ml-auto">
            {stepNumber === totalSteps ? 'Weiter' : nextButtonText}
            {stepNumber < totalSteps && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
