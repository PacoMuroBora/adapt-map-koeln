# Button

**Figma**: [Button Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-44442&p=f&m=dev)

**Location**: `src/components/ui/button.tsx`

**Base Component**: shadcn/ui Button (already implemented)

## Implementation

Update `src/components/ui/button.tsx` to match Figma specifications. The component uses `class-variance-authority` (cva) for variant management:

```tsx
import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-sans text-base font-normal leading-none tracking-[1px] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
      shape: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
        mini: 'h-8 px-2 text-sm',
        tiny: 'h-6 w-6 text-xs',
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-[#141418] text-white hover:bg-[#1e1e20]',
        outline: 'border border-border bg-background text-foreground hover:bg-muted',
        destructive: 'bg-[#ff8429] text-white hover:bg-[#e6731f]',
        ghost: 'bg-transparent text-foreground hover:bg-muted/50',
      },
      shape: {
        default: 'rounded-lg',
        round: 'rounded-full',
      },
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, 
          VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

## Variants

1. **Primary** (`variant="default"`)
   - Background: `bg-primary` (lime green `#BEE75D` via CSS variable)
   - Text: `text-primary-foreground` (dark text)
   - Hover: `hover:bg-primary/90`
   - Focus: Ring with `ring-ring`

2. **Secondary** (`variant="secondary"`)
   - Background: `bg-[#141418]` (dark gray/black)
   - Text: `text-white`
   - Hover: `hover:bg-[#1e1e20]` (slightly lighter)

3. **Outline** (`variant="outline"`)
   - Background: `bg-background` (white)
   - Border: `border border-border` (light gray)
   - Text: `text-foreground` (dark)
   - Hover: `hover:bg-muted` (very light gray)

4. **Destructive** (`variant="destructive"`)
   - Background: `bg-[#ff8429]` (orange)
   - Text: `text-white`
   - Hover: `hover:bg-[#e6731f]` (darker orange)

5. **Ghost** (`variant="ghost"`)
   - Background: `bg-transparent`
   - Text: `text-foreground` (dark)
   - Hover: `hover:bg-muted/50` (subtle gray)

## Sizes

- **default**: `h-10 px-4 py-2` (40px height, 16px horizontal padding)
- **sm**: `h-9 px-3` (36px height, 12px horizontal padding)
- **lg**: `h-11 px-8` (44px height, 32px horizontal padding)
- **icon**: `h-10 w-10` (40×40px square)
- **mini**: `h-8 px-2 text-sm` (32px height, smaller text)
- **tiny**: `h-6 w-6 text-xs` (24×24px circle)

## Shapes

- **default**: `rounded-lg` (8px border radius)
- **round**: `rounded-full` (pill/circular shape) - use `shape="round"` prop

## Typography

- Font Family: `font-sans` (Uncut Sans)
- Font Size: `text-base` (16px) for default, scales with size
- Font Weight: `font-normal` (400)
- Line Height: `leading-none` (1)
- Letter Spacing: `tracking-[1px]` (1px)

## Spacing

- Gap between icon and text: `gap-2` (8px) - add manually: `<Button><Icon className="mr-2" />Text</Button>`

## Usage Examples

```tsx
{/* Primary button with icon */}
<Button variant="default" size="default">
  <Plus className="mr-2 h-4 w-4" />
  ADD ITEM
</Button>

{/* Secondary button */}
<Button variant="secondary">LOGIN WITH EMAIL</Button>

{/* Round pill button */}
<Button variant="default" shape="round" size="lg">
  WEITER
</Button>

{/* Icon-only button */}
<Button variant="ghost" size="icon">
  <Edit className="h-4 w-4" />
</Button>

{/* Destructive button */}
<Button variant="destructive">DELETE</Button>
```
