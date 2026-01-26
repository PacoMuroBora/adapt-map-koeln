# Input

**Figma**: [Input Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-49172&p=f&m=dev)

**Location**: `src/components/ui/input.tsx`

**Base Component**: shadcn/ui Input (already implemented)

## Implementation

The Input component is already implemented. Update it to match Figma specifications:

```tsx
import { cn } from '@/utilities/ui'
import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  shape?: 'default' | 'round'
  size?: 'default' | 'sm' | 'lg' | 'mini'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, shape = 'default', size = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full font-body text-sm font-normal bg-background text-foreground placeholder:text-muted-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Size variants
          {
            'h-10 px-3 py-2': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-4': size === 'lg',
            'h-8 px-2 text-xs': size === 'mini',
          },
          // Shape variants
          {
            'rounded-lg border border-border': shape === 'default',
            'rounded-full border border-border': shape === 'round',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

## Shapes

- **default**: `rounded-lg` (8px border radius)
- **round**: `rounded-full` (pill-shaped) - use `shape="round"` prop

## Sizes

- **default**: `h-10 px-3 py-2` (40px height)
- **sm**: `h-9 px-3 text-sm` (36px height, smaller text)
- **lg**: `h-11 px-4` (44px height)
- **mini**: `h-8 px-2 text-xs` (32px height, smallest text)

## States

1. **Empty/Placeholder**
   - Background: `bg-background` (white)
   - Border: `border border-border` (light gray)
   - Text: `placeholder:text-muted-foreground` (light gray)

2. **Value**
   - Background: `bg-background` (white)
   - Border: `border border-border` (light gray)
   - Text: `text-foreground` (dark)

3. **Focus**
   - Background: `bg-background` (white)
   - Border: `border-border` (light gray)
   - Ring: `focus-visible:ring-2 focus-visible:ring-ring` (purple/blue-gray)
   - Text: `text-foreground` (dark)

4. **Error**
   - Background: `bg-background` (white)
   - Border: `border-error` (orange-red)
   - Text: `text-foreground` (dark)

5. **Error Focus**
   - Background: `bg-background` (white)
   - Border: `border-error` (orange-red, thicker)
   - Ring: `focus-visible:ring-2 focus-visible:ring-error` (orange-red ring)
   - Text: `text-foreground` (dark)

6. **Disabled**
   - Background: `bg-muted` (light gray)
   - Border: `border-border` (light gray)
   - Text: `disabled:opacity-50` (muted)
   - Cursor: `disabled:cursor-not-allowed`

## Typography

- Font Family: `font-body` (Uncut Sans)
- Font Size: `text-sm` (14px) for default, scales with size
- Font Weight: `font-normal` (400)

## Border Radius

- **Default**: `rounded-lg` (8px)
- **Round**: `rounded-full` (pill shape)

## Usage Examples

```tsx
{/* Default input */}
<Input placeholder="Enter your email" />

{/* Round pill input */}
<Input shape="round" placeholder="Search..." />

{/* Large input */}
<Input size="lg" placeholder="Full name" />

{/* Error state */}
<Input className="border-error focus-visible:ring-error" placeholder="Required field" />

{/* Disabled */}
<Input disabled placeholder="Disabled input" />
```
