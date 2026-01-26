# Link Button

**Figma**: [Link Button Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-44446&p=f&m=dev)

**Location**: `src/components/ui/button.tsx` (link variant)

## Variants

- **Default**: Subtle border-radius
- **Round**: Fully rounded, pill-shaped corners

## Sizes

- **Default**: Standard size
- **Large**: Wider and taller
- **Small**: Shorter and slightly narrower
- **Mini**: Smallest size, significantly shorter and narrower

## States

- **Default**: Dark gray "Label" text only, no underline, transparent background, no border
- **Hover & Active**: Dark gray text with solid dark gray underline (`1px` thick)
- **Focus**: Dark gray text with underline, light gray border/outline around content area
  - Default variant: Small border-radius (2-4px)
  - Round variant: Fully rounded border-radius

## Typography

- Font Family: `Uncut Sans`
- Text Color: `#141418` (dark gray/black)
- Font size scales with size variant
- Underline color: Same as text color (`#141418`)

## Spacing

- Internal padding between text and bounding box/outline
- Distance of underline from text
- Padding around external link icon if present

## Usage

Can include optional external link icons or other icons appended to the right of text.
