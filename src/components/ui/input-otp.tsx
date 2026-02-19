'use client'

import { cn } from '@/utilities/ui'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

const otpInputVariants = cva(
  'flex items-center justify-center text-center border transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        default: 'h-12 w-12 text-lg',
        large: 'h-14 w-14 text-[1.75rem]',
        small: 'h-10 w-10 text-base',
        'x-sm': 'h-8 w-8 text-sm',
      },
      state: {
        empty: 'border-border bg-background',
        placeholder: 'border-border bg-background text-muted-foreground',
        value: 'border-border bg-background text-foreground',
        focus: 'border-primary shadow-[0_0_0_3px_rgba(0,0,0,0.1)]',
        error: 'border-error text-foreground',
        'error-focus': 'border-error ring-error',
        disabled: 'border-muted bg-muted text-muted-foreground opacity-50',
        'plz-empty':
          'border-am-purple-alt bg-white font-mono text-muted-foreground focus-visible:shadow-[0_0_0_3px_rgba(159,148,255,0.35)]',
        'plz-value':
          'border-am-purple-alt bg-white font-mono text-foreground focus-visible:shadow-[0_0_0_3px_rgba(159,148,255,0.35)]',
      },
      shape: {
        default: 'rounded-lg',
        round: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'empty',
      shape: 'round',
    },
  },
)

export interface InputOTPProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'>,
    VariantProps<typeof otpInputVariants> {
  length?: number
  separator?: string
  separatorPosition?: number
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  /** Placeholder character for empty slots (e.g. "0" for PLZ) */
  placeholderChar?: string
  /** PLZ variant: circular inputs, white on lavender, purple border */
  variant?: 'default' | 'plz'
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  (
    {
      length = 6,
      separator,
      separatorPosition,
      size = 'default',
      shape = 'round',
      value = '',
      onChange,
      onComplete,
      className,
      disabled,
      placeholderChar,
      variant = 'default',
      ...props
    },
    ref,
  ) => {
    const [otp, setOtp] = React.useState<string[]>(
      value
        .split('')
        .slice(0, length)
        .concat(Array(Math.max(0, length - value.length)).fill('')),
    )
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    React.useEffect(() => {
      if (value) {
        const newOtp = value
          .split('')
          .slice(0, length)
          .concat(Array(Math.max(0, length - value.length)).fill(''))
        setOtp(newOtp)
      } else {
        setOtp(Array(length).fill(''))
      }
    }, [value, length])

    const handleChange = (index: number, newValue: string) => {
      if (disabled) return

      // Only allow single digit
      const digit = newValue.slice(-1).replace(/\D/g, '')
      if (digit && !/^\d$/.test(digit)) return

      const newOtp = [...otp]
      newOtp[index] = digit
      setOtp(newOtp)

      const otpValue = newOtp.join('')
      onChange?.(otpValue)

      // Move to next input if digit entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Call onComplete if all fields filled
      if (otpValue.length === length && !otpValue.includes('')) {
        onComplete?.(otpValue)
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent, index: number) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text').slice(0, length)
      const digits = pastedData.split('').filter((char) => /^\d$/.test(char))
      const updatedOtp = [...otp]
      digits.forEach((digit, i) => {
        if (index + i < length) {
          updatedOtp[index + i] = digit
        }
      })
      setOtp(updatedOtp)
      const otpValue = updatedOtp.join('')
      onChange?.(otpValue)
      if (otpValue.length === length && !otpValue.includes('')) {
        onComplete?.(otpValue)
      }
      // Focus the last filled input or next empty one
      const lastFilledIndex = Math.min(index + digits.length - 1, length - 1)
      inputRefs.current[lastFilledIndex]?.focus()
    }

    const getState = (index: number): VariantProps<typeof otpInputVariants>['state'] => {
      if (disabled) return 'disabled'
      if (variant === 'plz') {
        if (otp[index]) return 'plz-value'
        return 'plz-empty'
      }
      if (otp[index]) return 'value'
      return 'empty'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-1',
          variant === 'plz' && 'rounded-2xl bg-am-purple/25',
          className,
        )}
        {...props}
      >
        {Array.from({ length }).map((_, index) => (
          <React.Fragment key={index}>
            <input
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index] || ''}
              placeholder={placeholderChar}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(e, index)}
              disabled={disabled}
              className={cn(
                otpInputVariants({
                  size,
                  shape,
                  state: getState(index),
                }),
              )}
              aria-label={`OTP digit ${index + 1}`}
            />
            {separator && separatorPosition !== undefined && index === separatorPosition - 1 && (
              <span className="text-foreground font-medium">{separator}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  },
)
InputOTP.displayName = 'InputOTP'

export { InputOTP }
