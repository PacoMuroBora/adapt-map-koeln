# Alert

**Figma**: [Alert Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-44439&p=f&m=dev)

**Location**: `src/components/ui/alert.tsx` (to be implemented)

**Base Component**: shadcn/ui Alert

## Implementation

Install shadcn Alert component first:
```bash
npx shadcn@latest add alert
```

Then customize `src/components/ui/alert.tsx` to match Figma specifications:

```tsx
import { cn } from '@/utilities/ui'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        error: 'bg-error/10 text-error border-error',
        success: 'bg-success/10 text-success border-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean
  showLine2?: boolean
  showButtons?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, showIcon = false, showLine2 = false, showButtons = false, children, ...props }, ref) => {
    const icon = variant === 'error' ? <AlertCircle className="h-4 w-4" /> 
                : variant === 'success' ? <CheckCircle2 className="h-4 w-4" />
                : showIcon ? <div className="h-4 w-4 border border-muted-foreground" /> : null

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && icon}
        <div className={cn('flex items-center justify-between', showButtons && 'gap-4')}>
          <div className={cn('flex flex-col', showLine2 && 'space-y-1')}>
            {children}
          </div>
          {showButtons && (
            <Button variant="ghost" size="sm">
              Action
            </Button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
```

## Variants

1. **Neutral** (`variant="default"`)
   - Background: `bg-background` (white)
   - Border: `border-border` (light gray, 1px solid)
   - Text: `text-foreground` (dark gray/black)
   - Icon: Light gray outline square (if `showIcon=true`)

2. **Error** (`variant="error"`)
   - Background: `bg-error/10` (very light red/pink)
   - Border: `border-error` (red, 1px solid)
   - Text: `text-error` (red)
   - Icon: `AlertCircle` (red circle with exclamation mark)

3. **Success** (`variant="success"`)
   - Background: `bg-success/10` (very light green)
   - Border: `border-success` (green, 1px solid)
   - Text: `text-success` (dark green)
   - Icon: `CheckCircle2` (green checkmark in circle)

## Structural Options

- **`showIcon`**: `true` displays icon on left, `false` hides icon
- **`showLine2`**: `true` displays two lines (title + description), `false` displays single line
- **`showButtons`**: `true` displays action button on right, `false` hides button

## Typography

- **Line 1 (Title)**: `text-sm font-medium` (standard body text)
- **Line 2 (Description)**: `text-sm text-muted-foreground` (smaller, muted text)
- **Action Button Text**: `text-sm` (small button text)

## Spacing

- Container Padding: `p-4` (16px on all sides)
- Icon to Text Gap: `pl-7` (28px left padding when icon present)
- Line 1 to Line 2 Gap: `space-y-1` (4px vertical spacing)
- Text to Button Gap: `gap-4` (16px horizontal gap)

## Border Radius

`rounded-lg` (8px) - matches `--radius-lg`

## Icons

- Success: `CheckCircle2` from `lucide-react`
- Error: `AlertCircle` from `lucide-react`
- Neutral: Custom border square (placeholder)

## Usage Examples

```tsx
{/* Neutral alert */}
<Alert>
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>This is a neutral alert message.</AlertDescription>
</Alert>

{/* Error alert with icon */}
<Alert variant="error" showIcon>
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>

{/* Success alert with two lines */}
<Alert variant="success" showIcon showLine2>
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>

{/* Alert with action button */}
<Alert variant="error" showIcon showButtons>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Please review your input.</AlertDescription>
</Alert>
```
