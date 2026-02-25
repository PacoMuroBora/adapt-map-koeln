'use client'

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
import { LinkButton } from '@/components/ui/link-button'
import { Loader2 } from 'lucide-react'
import { Home, Building, Plus, Target, TreePine, Check, X } from 'lucide-react'
import { isValidColognePlz } from '@/utilities/colognePlz'
import type { Question } from '../../questions'
import type { SubmissionState } from '@/providers/Submission/types'
import type { ResolvedAddress } from './questionClientUtils'

export type { ResolvedAddress }

export interface QuestionCaseInputContext {
  state: SubmissionState
  /** Current step answers (for address prefill merge) */
  stepAnswers: Record<string, any>
  setError: (e: string | null) => void
  questionnaireName: string
  stepNumber: number
  totalSteps: number
  updateLocation: (loc: {
    lat: number
    lng: number
    postal_code: string | null
    city: string | null
    street?: string
    housenumber?: string
  }) => void
  updateAnswer: (questionKey: string, answer: any) => void
  resolvedAddress: ResolvedAddress | null
  setResolvedAddress: (a: ResolvedAddress | null) => void
  formatDisplayAddress: (addr: ResolvedAddress) => string
  onGPSLocation: () => void
  onManualAddress: () => void
  isGpsLoading: boolean
}

export interface QuestionCaseInputProps {
  question: Question
  color: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
  answer: any
  setAnswer: (value: any) => void
  context: QuestionCaseInputContext
}

export function QuestionCaseInput({
  question,
  color = 'purple',
  answer,
  setAnswer,
  context,
}: QuestionCaseInputProps): React.ReactNode {
  const {
    state,
    stepAnswers,
    setError,
    questionnaireName,
    stepNumber,
    totalSteps,
    updateLocation,
    updateAnswer,
    resolvedAddress,
    setResolvedAddress,
    formatDisplayAddress,
    onGPSLocation,
    onManualAddress,
    isGpsLoading,
  } = context

  const setAnswerForQ = setAnswer

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
                onManualAddress()
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
            onClick={onGPSLocation}
            disabled={isGpsLoading}
            iconAfter={isGpsLoading ? null : 'locate'}
          >
            {isGpsLoading ? (
              <div className="flex flex-row items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Standort wird ermittelt...
              </div>
            ) : (
              <>Standort ermitteln</>
            )}
          </Button>
          <div className="flex justify-center">
            <LinkButton
              href={`/questionnaire/${questionnaireName}/${stepNumber + 1}`}
              onClick={(e) => {
                e.preventDefault()
                onManualAddress()
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
                isValidColognePlz(val) ? null : 'Bitte gib eine gültige Postleitzahl von Köln ein.',
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
            return (
              <RadioCardItem key={index} value={option.value} label={option.label} color={color} />
            )
          })}
        </RadioCardGroup>
      )

    case 'singleChoiceWithIcon':
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
              ) : text.includes('ja') ? (
                <Check className="h-5 w-5" />
              ) : text.includes('nein') ? (
                <X className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )
            return (
              <RadioCardItem
                key={index}
                value={option.value}
                label={option.label}
                icon={icon}
                color={color}
              />
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

    case 'slider': {
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
    }

    case 'sliderHorizontalRange': {
      const rangeConfig = question.sliderConfig
      const rangeMin = rangeConfig?.min ?? 0
      const rangeMax = rangeConfig?.max ?? 100
      const rangeStep = rangeConfig?.step ?? 1
      const rangeUnit = rangeConfig?.unit
      const rangeValue: [number, number] =
        Array.isArray(answer) &&
        answer.length === 2 &&
        typeof answer[0] === 'number' &&
        typeof answer[1] === 'number'
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
      const vDefault = vMin + Math.round((vMax - vMin) / (2 * vStep)) * vStep
      const vValue =
        answer !== null && answer !== undefined && typeof answer === 'number' ? answer : vDefault

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
          color={color}
          placeholder="Schreib etwas..."
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
            placeholder="Schreib etwas..."
            rows={rows}
            color={color}
            className="resize-none"
          />
          <div className="flex justify-end px-2 text-sm text-muted-foreground">
            <span className={len >= maxLen ? 'text-destructive' : ''}>
              {maxLen - len} verbleibend
            </span>
          </div>
        </div>
      )
    }

    case 'consent': {
      const consentConfig = question.consentConfig
      const consentText =
        consentConfig?.consentText ?? 'Ich stimme der Erhebung und Verarbeitung meiner Daten zu.'
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
            <Label
              htmlFor={`consent-${question.key}`}
              className="text-base font-medium leading-none cursor-pointer"
            >
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
                    color={color}
                    placeholder="Schreib etwas..."
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
                            : 'Bitte gib eine gültige Postleitzahl von Köln ein.',
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
