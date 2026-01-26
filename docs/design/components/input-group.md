# Input Group

**Figma**: [Input Group Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=885-2&p=f&m=dev)

**Location**: `src/components/ui/input.tsx` (grouped variant)

## Description

Groups multiple input-related elements together, including prefixes, suffixes, icons, and buttons.

## Components

1. **Icons on Both Sides**
   - Search Input: Magnifying glass icon on left, placeholder "Search..."
   - Email Input: Envelope icon on left, placeholder "Enter your email"
   - Validated Card Number: Credit card icon on left, checkmark icon on right, placeholder "Card number"
   - Card Number with Actions: Placeholder "Card number", star icon and info icon on right

2. **Buttons Inside the Group**
   - URL Input with Copy Button: "https://x.com/shadcn" with copy icon button integrated on right
   - URL Prefix Input: "https://" prefix integrated left of editable input, star icon button on right
   - Search Input with Button: Text input "Type to search..." directly adjoined to dark gray "Search" button on right

3. **Specialized Input Fields**
   - Currency Input: "$" prefix, editable input, "USD" suffix, all within single bordered unit
   - Email Domain Input: "https://aaa" prefix, editable input, "@company.com" suffix
   - Textarea with Character Count: Multi-line input with "120 characters left" helper text below

## Design Variables

- Consistent border-radius (slightly rounded, `var(--radius)` or `md`)
- Standard height (`h-10` common)
- Placeholder text styling
- Icon placement and sizing
- Prefix/suffix styling
