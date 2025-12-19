'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmission } from '@/providers/Submission'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Question } from '@/payload-types'

type QuestionClientProps = {
  question: Question
  stepNumber: number
  totalSteps: number
  questionnaireVersion: string
  nextButtonText: string
  previousButtonText: string
}

export default function QuestionClient({
  question,
  stepNumber,
  totalSteps,
  questionnaireVersion,
  nextButtonText,
  previousButtonText,
}: QuestionClientProps) {
  const router = useRouter()
  const { state, updateAnswer, updateAnswers, updateCurrentStep, updateQuestionnaireVersion } =
    useSubmission()
  const [answer, setAnswer] = useState<any>(state.answers[question.key] || null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set questionnaire version if not set
    if (!state.questionnaireVersion) {
      updateQuestionnaireVersion(questionnaireVersion)
    }
  }, [state.questionnaireVersion, questionnaireVersion, updateQuestionnaireVersion])

  const progress = (stepNumber / totalSteps) * 100

  const handleNext = () => {
    if (question.required && !answer) {
      setError('Bitte beantworten Sie diese Frage.')
      return
    }

    updateAnswer(question.key, answer)
    updateCurrentStep('questionnaire')

    if (stepNumber < totalSteps) {
      router.push(`/questionnaire/${stepNumber + 1}`)
    } else {
      router.push('/feedback')
    }
  }

  const handlePrevious = () => {
    updateAnswer(question.key, answer)
    if (stepNumber > 1) {
      router.push(`/questionnaire/${stepNumber - 1}`)
    } else {
      router.push('/personal')
    }
  }

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'singleChoice':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <div className="space-y-3">
            {question.options.map((option: any, index: number) => (
              <label
                key={index}
                className="flex cursor-pointer items-center space-x-3 rounded-lg border bg-card p-4 hover:bg-muted"
              >
                <input
                  type="radio"
                  name={question.key}
                  value={option.value}
                  checked={answer === option.value}
                  onChange={(e) => {
                    setAnswer(e.target.value)
                    setError(null)
                  }}
                  className="h-4 w-4"
                />
                <span className="flex-1">{option.label || option.value}</span>
              </label>
            ))}
          </div>
        )

      case 'multiChoice':
        if (!question.options || !Array.isArray(question.options)) return null
        const selectedValues = Array.isArray(answer) ? answer : []
        return (
          <div className="space-y-3">
            {question.options.map((option: any, index: number) => (
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
                <span className="flex-1">{option.label || option.value}</span>
              </label>
            ))}
          </div>
        )

      case 'dropdown':
        if (!question.options || !Array.isArray(question.options)) return null
        return (
          <Select value={answer || ''} onValueChange={(value) => {
            setAnswer(value)
            setError(null)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Bitte auswählen" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option: any, index: number) => (
                <SelectItem key={index} value={option.value}>
                  {option.label || option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'slider':
        const sliderConfig = question.sliderConfig as any
        const min = sliderConfig?.min || 0
        const max = sliderConfig?.max || 100
        const step = sliderConfig?.step || 1
        const unit = sliderConfig?.unit || ''
        const sliderValue = answer !== null && answer !== undefined ? answer : min

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slider">Wert: {sliderValue}{unit}</Label>
                <span className="text-sm text-muted-foreground">
                  {min}{unit} - {max}{unit}
                </span>
              </div>
              <input
                id="slider"
                type="range"
                min={min}
                max={max}
                step={step}
                value={sliderValue}
                onChange={(e) => {
                  setAnswer(parseFloat(e.target.value))
                  setError(null)
                }}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}{unit}</span>
              <span>{max}{unit}</span>
            </div>
          </div>
        )

      default:
        return <p className="text-muted-foreground">Unbekannter Fragetyp</p>
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frage {stepNumber} von {totalSteps}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{question.title_de}</h1>
            {question.description_de && (
              <p className="text-muted-foreground">{question.description_de}</p>
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
          <Button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {stepNumber === totalSteps ? 'Zum Feedback' : nextButtonText}
            {stepNumber < totalSteps && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

