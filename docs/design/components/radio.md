# Radio

**Figma**: [Radio Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=2244-39191&p=f&m=dev)

**Location**: `src/components/ui/radio.tsx` (if exists)

## Description

A set of checkable buttons where no more than one can be checked at a time.

## Structure

Each radio button has:
- Rounded rectangular shape
- Small icon (e.g., house icon)
- Text label centered below icon (e.g., "IN EINEM HAUS")

## Variants

- **Teil 1**: One styling group
- **Teil 2**: Another styling group (styling appears consistent)

## States

1. **Default - Unchecked**
   - Background: White
   - Border: Thin, light gray border
   - Text/Icon Color: Black

2. **Default - Checked**
   - Background: Bright lime green (`#BEE75D`)
   - Border: Thin, slightly darker lime green border
   - Text/Icon Color: Black

3. **Focus - Unchecked**
   - Base: Same as Default Unchecked
   - Focus Indicator: Distinct, thin blue outline (ring) around entire button

4. **Focus - Checked**
   - Base: Same as Default Checked
   - Focus Indicator: Distinct, thin blue outline (ring) around entire button

5. **Hover - Unchecked**
   - Background: Very light cream/yellowish color
   - Border: Thin, light orange border
   - Text/Icon Color: Black

6. **Hover - Checked**
   - Background: Similar to Default Checked (bright lime green)
   - Border: Similar to Default Checked
   - Text/Icon Color: Black

7. **Disabled - Unchecked**
   - Background: Light gray
   - Border: Thin, very light gray border
   - Text/Icon Color: Faded gray (reduced opacity)

8. **Disabled - Checked**
   - Background: Pale, desaturated lime green
   - Border: Thin, very light pale lime green border
   - Text/Icon Color: Faded gray (reduced opacity)

## Design Variables

- **Border Radius**: Consistent rounding for all button corners
- **Typography**: Consistent sans-serif font, color changes based on state
- **Iconography**: Simple, consistent icons
- **Spacing**: Consistent internal padding and spacing between buttons
