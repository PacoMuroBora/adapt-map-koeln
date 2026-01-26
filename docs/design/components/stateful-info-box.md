# Stateful Info Box

**Figma**: [Stateful Info Box Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=2364-54885&m=dev)

**Location**: `src/components/ui/stateful-info-box.tsx` (to be implemented)

**Base Component**: Custom component built with shadcn/ui primitives

## Description

A highly configurable list item or info box component that displays text content with optional icons and action buttons. Supports multiple states including neutral and error variants.

## Implementation

```tsx
import * as React from "react"
import { cn } from "@/utilities/ui"
import { Button } from "@/components/ui/button"
import { Square, Checkbox, AlertCircle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const statefulInfoBoxVariants = cva(
  "relative w-full rounded-lg border p-4 flex items-center justify-between gap-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        error: "bg-error/10 text-error border-2 border-dashed border-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface StatefulInfoBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statefulInfoBoxVariants> {
  line1: string
  line2?: string
  showIcon?: boolean
  flipIcon?: boolean
  showButton?: boolean
  buttonLabel?: string
  iconType?: "square" | "checkbox"
  onButtonClick?: () => void
}

const StatefulInfoBox = React.forwardRef<HTMLDivElement, StatefulInfoBoxProps>(
  (
    {
      line1,
      line2,
      showIcon = false,
      flipIcon = false,
      showButton = false,
      buttonLabel = "Label",
      iconType = "square",
      variant = "default",
      onButtonClick,
      className,
      ...props
    },
    ref
  ) => {
    const IconComponent = iconType === "checkbox" ? Checkbox : Square
    const isError = variant === "error"

    return (
      <div
        ref={ref}
        className={cn(statefulInfoBoxVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn("flex items-center gap-2", {
            "flex-row-reverse": flipIcon,
          })}
        >
          {showIcon && (
            <IconComponent
              className={cn("h-5 w-5 flex-shrink-0", {
                "text-foreground": !isError,
                "text-error": isError,
              })}
            />
          )}
          <div className={cn("flex flex-col", { "space-y-1": line2 })}>
            <span
              className={cn("font-medium", {
                "text-foreground": !isError,
                "text-error": isError,
              })}
            >
              {line1}
            </span>
            {line2 && (
              <span
                className={cn("text-sm", {
                  "text-muted-foreground": !isError,
                  "text-error": isError,
                })}
              >
                {line2}
              </span>
            )}
          </div>
        </div>

        {showButton && (
          <Button
            variant={isError ? "destructive" : "secondary"}
            size="sm"
            onClick={onButtonClick}
            className={cn("rounded-full text-sm h-auto py-1 px-3", {
              "bg-button-neutral-bg text-button-neutral-text": !isError,
              "bg-button-error-bg text-button-error-text": isError,
            })}
          >
            {buttonLabel}
          </Button>
        )}
      </div>
    )
  }
)
StatefulInfoBox.displayName = "StatefulInfoBox"

export { StatefulInfoBox }
```

## Variants

1. **Neutral** (`variant="default"`)
   - Background: `bg-background` (white)
   - Border: `border border-border` (light gray, 1px solid)
   - Text: `text-foreground` (dark gray/black)
   - Icon: Dark gray/black icon (if `showIcon=true`)

2. **Error** (`variant="error"`)
   - Background: `bg-error/10` (very light red/pink)
   - Border: `border-2 border-dashed border-error` (red, 2px dashed)
   - Text: `text-error` (red)
   - Icon: Red icon (if `showIcon=true`)

## Structural Options

- **`showIcon`**: `true` displays icon on left (or right if `flipIcon=true`), `false` hides icon
- **`flipIcon`**: `true` positions icon on right side, `false` positions on left (default)
- **`showLine2`**: Controlled by providing `line2` prop - displays second line of text
- **`showButton`**: `true` displays action button on right, `false` hides button
- **`iconType`**: `"square"` or `"checkbox"` - determines icon appearance

## Typography

- **Line 1**: `font-medium` (standard body text, bold)
- **Line 2**: `text-sm text-muted-foreground` (smaller, muted text) or `text-sm text-error` (error state)

## Spacing

- Container Padding: `p-4` (16px on all sides)
- Icon to Text Gap: `gap-2` (8px)
- Line 1 to Line 2 Gap: `space-y-1` (4px vertical spacing)
- Text to Button Gap: `gap-4` (16px horizontal gap)

## Border Radius

`rounded-lg` (8px) - matches `--radius-lg`

## Icons

- Default: `Square` from `lucide-react`
- Checkbox: `Checkbox` from `lucide-react`
- Error: `AlertCircle` from `lucide-react` (can be used for error variant)

## Button Styling

- **Neutral State Button**: Light gray background (`bg-button-neutral-bg`), dark gray text (`text-button-neutral-text`)
- **Error State Button**: Light red background (`bg-button-error-bg`), red text (`text-button-error-text`)
- Shape: `rounded-full` (pill shape)
- Size: `text-sm h-auto py-1 px-3`

## Usage Examples

```tsx
{/* Neutral info box with single line */}
<StatefulInfoBox line1="Information" />

{/* Neutral info box with icon and two lines */}
<StatefulInfoBox
  line1="Title"
  line2="Description text"
  showIcon
  iconType="square"
/>

{/* Error state with icon and button */}
<StatefulInfoBox
  variant="error"
  line1="Error occurred"
  line2="Please check your input"
  showIcon
  showButton
  buttonLabel="Fix"
  onButtonClick={() => console.log("Fix clicked")}
/>

{/* Icon on right side */}
<StatefulInfoBox
  line1="Label"
  showIcon
  flipIcon
  showButton
  buttonLabel="Action"
/>

{/* With checkbox icon */}
<StatefulInfoBox
  line1="Completed"
  line2="Task finished successfully"
  showIcon
  iconType="checkbox"
/>
```

## Global Variables

Add these to `globals.css`:

```css
:root {
  --button-neutral-bg: 210 40% 96.1%; /* light gray */
  --button-neutral-text: 222.2 47.4% 11.2%; /* dark gray */
  --button-error-bg: 0 100% 98%; /* very light red */
  --button-error-text: 0 84.2% 60.2%; /* red */
}
```

Add to `tailwind.config.mjs`:

```js
colors: {
  'button-neutral-bg': 'hsl(var(--button-neutral-bg))',
  'button-neutral-text': 'hsl(var(--button-neutral-text))',
  'button-error-bg': 'hsl(var(--button-error-bg))',
  'button-error-text': 'hsl(var(--button-error-text))',
}
```
