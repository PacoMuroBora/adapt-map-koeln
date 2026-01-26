# Radio Fancy

**Figma**: [Radio Fancy Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=2364-64474&m=dev)

**Location**: `src/components/ui/radio-fancy.tsx` (to be implemented)

**Base Component**: shadcn/ui Radio Group (extended)

## Description

A stylized radio button component that appears as a square button with an icon and text label. Unlike traditional radio buttons, these are designed as interactive card-like buttons where only one can be selected at a time within a group.

## Implementation

```tsx
import * as React from "react"
import { cn } from "@/utilities/ui"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { Home } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const radioFancyVariants = cva(
  "relative flex flex-col items-center justify-center gap-2 rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
  {
    variants: {
      checked: {
        false: "bg-background border-border text-foreground hover:bg-lime-50",
        true: "bg-lime-300 border-lime-500 text-foreground hover:bg-lime-200",
      },
      disabled: {
        false: "",
        true: "bg-gray-100 border-border text-gray-400 opacity-50",
      },
    },
    compoundVariants: [
      {
        checked: true,
        disabled: true,
        class: "bg-lime-100 border-border text-gray-400",
      },
    ],
    defaultVariants: {
      checked: false,
      disabled: false,
    },
  }
)

export interface RadioFancyProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroup.Root>,
    VariantProps<typeof radioFancyVariants> {
  icon?: React.ReactNode
  label: string
  value: string
}

const RadioFancyItem = React.forwardRef<
  React.ElementRef<typeof RadioGroup.Item>,
  RadioFancyProps
>(
  (
    { icon, label, value, className, disabled, ...props },
    ref
  ) => {
    return (
      <RadioGroup.Item
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn(radioFancyVariants({ checked: false, disabled }), className)}
        {...props}
      >
        {icon && (
          <div className="absolute top-2 right-2">
            {icon}
          </div>
        )}
        <span className="text-center">{label}</span>
      </RadioGroup.Item>
    )
  }
)
RadioFancyItem.displayName = "RadioFancyItem"

const RadioFancyGroup = RadioGroup.Root

export { RadioFancyGroup, RadioFancyItem }
```

## Structure

Each radio button contains:
- **Container**: Square-like button with rounded corners (`rounded-lg`)
- **Icon**: Positioned absolutely in top-right corner (e.g., house icon)
- **Label**: Centered text below icon (e.g., "IN EINEM HAUS")

## Variants

The component supports independent groups (e.g., "Teil 1", "Teil 2") using the `name` prop on `RadioGroup.Root`.

## States

### Unchecked State (`checked={false}`)

1. **Default**
   - Background: `bg-background` (white)
   - Border: `border border-border` (light gray)
   - Text/Icon: `text-foreground` (dark gray/black)

2. **Focus**
   - Base: Same as Default
   - Focus Indicator: `ring-2 ring-ring ring-offset-2` (blue/purple outline)

3. **Hover**
   - Background: `bg-lime-50` (very light lime green)
   - Border: `border-border` (light gray)
   - Text/Icon: `text-foreground` (dark)

4. **Disabled**
   - Background: `bg-gray-100` (light gray)
   - Border: `border-border` (light gray)
   - Text/Icon: `text-gray-400` (muted gray)
   - Opacity: `opacity-50`
   - Cursor: `cursor-not-allowed`

### Checked State (`checked={true}`)

1. **Default**
   - Background: `bg-lime-300` (medium lime green)
   - Border: `border border-lime-500` (darker lime green)
   - Text/Icon: `text-foreground` (dark gray/black)

2. **Focus**
   - Base: Same as Default Checked
   - Focus Indicator: `ring-2 ring-ring ring-offset-2` (blue/purple outline)

3. **Hover**
   - Background: `bg-lime-200` (lighter lime green than default checked)
   - Border: `border border-lime-400` (slightly lighter lime green)
   - Text/Icon: `text-foreground` (dark)

4. **Disabled**
   - Background: `bg-lime-100` (very light, muted lime green)
   - Border: `border-border` (light gray)
   - Text/Icon: `text-gray-400` (muted gray)
   - Opacity: `opacity-50`
   - Cursor: `cursor-not-allowed`

## Design Variables

- **Border Radius**: `rounded-lg` (8px) - consistent for all buttons
- **Typography**: Sans-serif font, medium weight
- **Spacing**: Consistent internal padding and spacing between icon and text
- **Colors**:
  - Lime green shades: `lime-50`, `lime-100`, `lime-200`, `lime-300`, `lime-400`, `lime-500`
  - Gray shades: `gray-100`, `gray-400`, `border` (light gray)
  - Focus ring: `ring` (blue/purple)

## Typography

- Font Family: Sans-serif
- Font Weight: `font-medium` (500)
- Text Alignment: `text-center`
- Color changes based on state (foreground for active, gray-400 for disabled)

## Spacing

- Container Padding: Consistent padding around content
- Icon Position: `absolute top-2 right-2` (8px from top and right)
- Gap between icon area and text: `gap-2` (8px)

## Icon Support

Icons are positioned in the top-right corner using absolute positioning. Common icons:
- House icon (`Home` from `lucide-react`)
- Other location/context-specific icons

## Usage Examples

```tsx
import { RadioFancyGroup, RadioFancyItem } from "@/components/ui/radio-fancy"
import { Home, Building, MapPin } from "lucide-react"

{/* Basic usage */}
<RadioFancyGroup defaultValue="house" name="location-type">
  <RadioFancyItem
    value="house"
    label="IN EINEM HAUS"
    icon={<Home className="h-5 w-5" />}
  />
  <RadioFancyItem
    value="apartment"
    label="IN EINER WOHNUNG"
    icon={<Building className="h-5 w-5" />}
  />
</RadioFancyGroup>

{/* Multiple independent groups */}
<RadioFancyGroup defaultValue="option1" name="teil1">
  <RadioFancyItem value="option1" label="Option 1" />
  <RadioFancyItem value="option2" label="Option 2" />
</RadioFancyGroup>

<RadioFancyGroup defaultValue="option3" name="teil2">
  <RadioFancyItem value="option3" label="Option 3" />
  <RadioFancyItem value="option4" label="Option 4" />
</RadioFancyGroup>

{/* Disabled state */}
<RadioFancyGroup defaultValue="house" name="location">
  <RadioFancyItem
    value="house"
    label="IN EINEM HAUS"
    icon={<Home className="h-5 w-5" />}
  />
  <RadioFancyItem
    value="apartment"
    label="IN EINER WOHNUNG"
    icon={<Building className="h-5 w-5" />}
    disabled
  />
</RadioFancyGroup>
```

## Global Variables

Uses existing design system variables:
- `--background` for default background
- `--border` for borders
- `--foreground` for text color
- `--ring` for focus ring

Lime green colors should be added to Tailwind config if not already present:

```js
// tailwind.config.mjs
colors: {
  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264', // Primary checked state
    400: '#a3e635',
    500: '#84cc16', // Border for checked state
  },
}
```

## Accessibility

- Uses Radix UI `RadioGroup` for proper ARIA attributes
- Keyboard navigation supported
- Focus states clearly visible
- Disabled state properly communicated

## Differences from Standard Radio

- Appears as a button/card rather than a small circle
- Contains icon and text label
- Uses lime green for checked state instead of traditional radio styling
- Supports hover states with subtle background changes
