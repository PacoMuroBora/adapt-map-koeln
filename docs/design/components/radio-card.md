# Radio Card

**Figma**: [Radio Card Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=2364-64474&m=dev)

**Location**: `src/components/ui/radio-card.tsx`

**Base Component**: Radix UI Radio Group

## Description

A stylized radio button component that appears as a card-like button with an icon and text label. Unlike traditional radio buttons, these are designed as interactive card-like buttons where only one can be selected at a time within a group.

## Implementation

```tsx
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card"
import { Home, Building } from "lucide-react"

<RadioCardGroup defaultValue="house" name="location-type">
  <RadioCardItem
    value="house"
    label="IN EINEM HAUS"
    icon={<Home className="h-5 w-5" />}
  />
  <RadioCardItem
    value="apartment"
    label="IN EINER WOHNUNG"
    icon={<Building className="h-5 w-5" />}
  />
</RadioCardGroup>
```

## Structure

Each radio button contains:
- **Container**: Card-like button with rounded corners (`rounded-lg`)
- **Icon**: Positioned absolutely in top-right corner (e.g., house icon)
- **Label**: Centered text below icon (e.g., "IN EINEM HAUS")

## Variants

The component supports two border variants when unchecked:
- **default** (Teil 1): Grey/purple border
- **orange** (Teil 2): Orange border

## States

### Unchecked State

- Background: `bg-background` (white)
- Border: `border-border` (default) or `border-am-orange-alt` (orange variant)
- Hover: `bg-[#FBFBF6]` (cream)
- Focus: Slate ring
- Disabled: Muted borders and text

### Checked State

- Background: `bg-am-green-alt` (lime green)
- Border: Dark green
- Hover: `bg-am-green`
- Disabled: Muted green background

## Usage Examples

```tsx
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card"
import { Home, Building, Plus } from "lucide-react"

{/* Basic usage */}
<RadioCardGroup defaultValue="house" name="location-type">
  <RadioCardItem
    value="house"
    label="IN EINEM HAUS"
    icon={<Home className="h-5 w-5" />}
  />
  <RadioCardItem
    value="apartment"
    label="IN EINER WOHNUNG"
    icon={<Building className="h-5 w-5" />}
  />
</RadioCardGroup>

{/* Orange variant (Teil 2) */}
<RadioCardGroup defaultValue="apartment" name="location-type-orange">
  <RadioCardItem value="house" label="IN EINEM HAUS" icon={<Home />} variant="orange" />
  <RadioCardItem value="apartment" label="IN EINER WOHNUNG" icon={<Building />} variant="orange" />
</RadioCardGroup>
```

## Accessibility

- Uses Radix UI `RadioGroup` for proper ARIA attributes
- Keyboard navigation supported
- Focus states clearly visible
- Disabled state properly communicated
