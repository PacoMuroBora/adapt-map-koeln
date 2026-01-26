# Input OTP

**Figma**: [Input OTP Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=2364-63703&m=dev)

**Location**: `src/components/ui/input-otp.tsx` (to be implemented)

**Base Component**: Custom component or shadcn/ui Input OTP (if available)

## Description

A One-Time Password (OTP) input component consisting of individual circular or rounded square input fields arranged horizontally. Each field accepts a single digit, typically used for verification codes.

## Implementation

```tsx
import * as React from "react"
import { cn } from "@/utilities/ui"
import { cva, type VariantProps } from "class-variance-authority"

const otpInputVariants = cva(
  "flex items-center justify-center text-center font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        default: "h-12 w-12 text-lg",
        large: "h-16 w-16 text-xl",
        small: "h-10 w-10 text-base",
        "x-sm": "h-8 w-8 text-sm",
      },
      state: {
        empty: "border-border bg-background",
        placeholder: "border-border bg-background text-muted-foreground",
        value: "border-border bg-background text-foreground",
        focus: "border-primary ring-primary",
        error: "border-error text-foreground",
        "error-focus": "border-error ring-error",
        disabled: "border-muted bg-muted text-muted-foreground opacity-50",
      },
      shape: {
        default: "rounded-lg",
        round: "rounded-full",
      },
    },
    defaultVariants: {
      size: "default",
      state: "empty",
      shape: "round",
    },
  }
)

export interface InputOTPProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof otpInputVariants> {
  length?: number
  separator?: string
  separatorPosition?: number
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  (
    {
      length = 6,
      separator,
      separatorPosition,
      size = "default",
      shape = "round",
      value = "",
      onChange,
      onComplete,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [otp, setOtp] = React.useState<string[]>(
      value.split("").slice(0, length)
    )
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    React.useEffect(() => {
      if (value) {
        const newOtp = value.split("").slice(0, length)
        setOtp(newOtp)
      }
    }, [value, length])

    const handleChange = (index: number, newValue: string) => {
      if (disabled) return

      // Only allow single digit
      const digit = newValue.slice(-1).replace(/\D/g, "")
      if (digit && !/^\d$/.test(digit)) return

      const newOtp = [...otp]
      newOtp[index] = digit
      setOtp(newOtp)

      const otpValue = newOtp.join("")
      onChange?.(otpValue)

      // Move to next input if digit entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Call onComplete if all fields filled
      if (otpValue.length === length && !otpValue.includes("")) {
        onComplete?.(otpValue)
      }
    }

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text").slice(0, length)
      const newOtp = pastedData.split("").filter((char) => /^\d$/.test(char))
      const updatedOtp = [...otp]
      newOtp.forEach((digit, i) => {
        if (index + i < length) {
          updatedOtp[index + i] = digit
        }
      })
      setOtp(updatedOtp)
      onChange?.(updatedOtp.join(""))
      if (updatedOtp.filter((d) => d).length === length) {
        onComplete?.(updatedOtp.join(""))
      }
    }

    const getState = (index: number): VariantProps<typeof otpInputVariants>["state"] => {
      if (disabled) return "disabled"
      // Add error state logic here if needed
      if (otp[index]) return "value"
      return "empty"
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
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
              value={otp[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled}
              className={cn(
                otpInputVariants({
                  size,
                  shape,
                  state: getState(index),
                })
              )}
              aria-label={`OTP digit ${index + 1}`}
            />
            {separator &&
              separatorPosition !== undefined &&
              index === separatorPosition - 1 && (
                <span className="text-foreground font-medium">{separator}</span>
              )}
          </React.Fragment>
        ))}
      </div>
    )
  }
)
InputOTP.displayName = "InputOTP"

export { InputOTP }
```

## Sizes

- **default**: `h-12 w-12 text-lg` (48×48px, large text)
- **large**: `h-16 w-16 text-xl` (64×64px, extra large text)
- **small**: `h-10 w-10 text-base` (40×40px, base text)
- **x-sm**: `h-8 w-8 text-sm` (32×32px, small text)

## Shapes

- **default**: `rounded-lg` (8px border radius)
- **round**: `rounded-full` (fully circular)

## States

1. **Empty**
   - Border: `border-border` (light gray)
   - Background: `bg-background` (white)
   - Content: No text

2. **Placeholder**
   - Border: `border-border` (light gray)
   - Background: `bg-background` (white)
   - Text: `text-muted-foreground` (light gray "0")

3. **Value**
   - Border: `border-border` (light gray)
   - Background: `bg-background` (white)
   - Text: `text-foreground` (dark "0")

4. **Focus**
   - Border: `border-primary` (blue/purple accent)
   - Ring: `ring-2 ring-primary` (focus ring)
   - Background: `bg-background` (white)
   - Text: `text-foreground` (dark)

5. **Error**
   - Border: `border-error` (orange-red)
   - Background: `bg-background` (white)
   - Text: `text-foreground` (dark)

6. **Error Focus**
   - Border: `border-error` (orange-red)
   - Ring: `ring-2 ring-error` (error focus ring)
   - Background: `bg-background` (white)
   - Text: `text-foreground` (dark)

7. **Disabled**
   - Border: `border-muted` (light gray)
   - Background: `bg-muted` (light gray)
   - Text: `text-muted-foreground` (muted gray)
   - Opacity: `opacity-50`
   - Cursor: `cursor-not-allowed`

## Typography

- Font Family: `font-medium` (sans-serif, medium weight)
- Text Alignment: `text-center` (centered within each input)
- Font sizes scale with size variant

## Spacing

- Gap between inputs: `gap-2` (8px)
- Can be adjusted with `gap-3` or `gap-4` for larger spacing

## Separator Support

The component supports optional separators (like hyphens) between digit groups:

```tsx
{/* 6-digit OTP with hyphen separator after 3rd digit */}
<InputOTP
  length={6}
  separator="-"
  separatorPosition={3}
/>
```

## Usage Examples

```tsx
{/* Default 6-digit OTP */}
<InputOTP
  length={6}
  value={otpValue}
  onChange={setOtpValue}
  onComplete={(value) => console.log("OTP complete:", value)}
/>

{/* Large size, round shape */}
<InputOTP
  length={6}
  size="large"
  shape="round"
/>

{/* Small size with separator */}
<InputOTP
  length={6}
  size="small"
  separator="-"
  separatorPosition={3}
/>

{/* Disabled state */}
<InputOTP
  length={6}
  value="123456"
  disabled
/>

{/* Error state (requires custom error handling) */}
<InputOTP
  length={6}
  className="[&_input]:border-error"
/>
```

## Accessibility

- Each input has `aria-label` for screen readers
- Supports keyboard navigation (arrow keys, backspace)
- Handles paste events for better UX
- Focus management moves to next field automatically

## Global Variables

Uses existing design system variables:
- `--border` for default borders
- `--primary` for focus state
- `--error` for error state
- `--muted` for disabled state
- `--foreground` for text color
- `--muted-foreground` for placeholder text
