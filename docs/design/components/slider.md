# Slider

**Figma**: [Slider Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-49188&p=f&m=dev)

**Location**: `src/components/questionnaire/HeatIntensitySlider.tsx`

## Description

An input where the user selects a value from within a given range.

## Vertical Slider

**Purpose**: Select value on vertical axis, representing intensity or continuous scale (e.g., "viel zu heiß" to "angenehm")

**Track/Bar**:
- Tall, rounded rectangle
- Gradient fill transitioning from dark orange/red at top to lighter yellowish orange/cream at bottom
- Estimated colors:
  - Top: Dark orange (`~#F36C21`)
  - Middle: Medium orange (`~#F8A05D`)
  - Bottom: Pale yellow/cream (`~#FDF0CD`)
- Thin, subtle border around gradient bar (dark gray or black)

**Thumb/Handle**:
- Thin, oval-shaped horizontal bar with thin black outline
- Overlays gradient track
- Variations:
  - **Default**: Positioned roughly in middle of track
  - **Range narrow**: Slightly more elongated horizontally
  - **Range wide**: Wider and squatter

## Horizontal Slider

**Note**: "POSTPONE THIS ONE" - lower priority for development

**Purpose**: Select value or range on horizontal axis with numerical values and unit

**Track/Bar**:
- Series of thin, vertical gray lines (tick marks)
- Lines become progressively darker and potentially thicker towards right end

**Thumb/Handle**:
- Single, prominent vertical black or dark gray line, centered on current value

**Value Display**:
- Numerical values displayed below slider track with unit "TAGE / JAHR" (Days / Year)
- **Default**: Value "18" centrally below handle
- **Range narrow**: Range "18 24" below highlighted section
- **Range wide**: Range "18 31" below highlighted section

## Marker States

**Vertical Marker**:
- **Regular**: Short, thin vertical line
- **Active**: Longer, thicker vertical line with number "18" positioned to left
- **Focus**: Vertical line similar to Regular, potentially slightly thicker

**Horizontal Marker**:
- **Regular**: Short, thin horizontal line
- **Active**: Longer, thicker horizontal line
- **Focus**: Horizontal line similar to Regular, potentially slightly thicker

## Labels

- "viel zu heiß" (much too hot) at top
- "angenehm" (pleasant) at bottom
- "TAGE / JAHR" (Days / Year) for horizontal slider

## Typography

Sans-serif font for labels and value display
