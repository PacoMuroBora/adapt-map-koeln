# Skeleton

**Figma**: [Skeleton Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-52052&p=f&m=dev)

**Location**: Not yet implemented

## Description

Visual placeholders for UI elements while content is loading.

## Types

1. **Skeleton (General Block)**
   - Shape: Large rounded rectangle
   - Dimensions: Approximately `200px` wide × `100px` tall
   - Usage: Represents larger content block (image or primary content area)

2. **Skeleton / Placeholder Avatar**
   - Structure: Small circular placeholder paired with short horizontal line placeholder
   - Circular Placeholder:
     - Shape: Perfect circle
     - Dimensions: Approximately `24px` to `32px` diameter
   - Line Placeholder:
     - Shape: Short, thin rounded rectangle
     - Dimensions: Approximately `80px` wide × `12px` tall
   - Usage: User avatar or small icon with accompanying name/label

3. **Skeleton / Placeholder Line**
   - Shape: Single, thin, horizontal rounded rectangle
   - Dimensions: Approximately `150px` wide × `12px` tall
   - Usage: Single line of text (heading or sentence)

4. **Skeleton / Placeholder Object**
   - Shape: Medium-sized rounded rectangle
   - Dimensions: Approximately `100px` wide × `50px` tall
   - Usage: Smaller interactive element or content card

## Design Variables

- **Background**: White (`#FFFFFF`)
- **Skeleton Placeholder Background**: Very light, subtle gray (mapped to `--muted` or `--card`)
- **Text Color**: Dark gray/black (`--foreground`)
- **Border Radius**:
  - Rectangular: Slightly rounded corners (`var(--radius)` or `rounded-lg`)
  - Circular: Perfectly circular (`rounded-full`)

## Typography

- Main Title: Large, bold, uppercase sans-serif
- Section Titles: Bold, uppercase sans-serif, smaller than main title
- Description Text: Smaller, regular weight sans-serif

## Spacing

- Generous vertical spacing between sections
- Horizontal spacing between section title and skeleton placeholder
- Spacing between avatar and accompanying text line
- Spacing between different lines or blocks within composite skeleton

## States

Skeletons inherently represent "loading" state. In practice, these placeholders would incorporate subtle shimmer or fade animation to visually convey activity.
