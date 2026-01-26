# Textarea

**Figma**: [Textarea Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-49180&p=f&m=dev)

**Location**: `src/components/ui/textarea.tsx`

## Shapes

- **Default**: Subtly rounded corners
- **Round**: Heavily rounded corners, pill-like appearance

## States

1. **Empty**
   - Background: Transparent
   - Border: Thin, dashed light purple line (design boundary)

2. **Placeholder**
   - Background: White
   - Border: Thin, solid light gray
   - Text: "Type your message here." in lighter gray
   - Resize Handle: Small gray triangle in bottom-right corner

3. **Value**
   - Background: White
   - Border: Thin, solid light gray
   - Text: "Value" in dark black (`text-foreground`)

4. **Focus**
   - Background: White
   - Border: Solid, medium blue-gray or darker gray, slightly thicker
   - Text: Dark "Value" text
   - Outline: Thin, dashed light purple line (focus boundary)

5. **Error**
   - Background: White
   - Border: Thin, solid orange-red (`--error`)
   - Text: Dark text

6. **Error Focus**
   - Background: White
   - Border: Thicker, darker orange-red (`--destructive`)
   - Text: Dark text
   - Outline: Thin, dashed light purple line

7. **Disabled**
   - Background: Light gray (`bg-muted`)
   - Border: Thin, solid light gray
   - Text: Lighter, muted gray (`disabled:opacity-50`)
   - Resize Handle: Visible but non-functional

## Typography

- Font Family: `Uncut Sans`
- Font Size: Consistent for placeholder and value text (`text-sm`)

## Border Radius

- **Default Variant**: Small, subtle `border-radius` (`var(--radius)`)
- **Round Variant**: Significantly larger `border-radius` (custom value for roundness)

## Resize Handle

Present in all states and variants: Small, gray triangle in bottom-right corner

## Min Height

All examples show substantial height, suggesting `min-height` property is applied (`min-h-[80px]`)
