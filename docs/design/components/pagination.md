# Pagination

**Figma**: [Pagination Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=2284-63269&p=f&m=dev)

**Location**: `src/components/ui/pagination.tsx`

## Description

Pagination with page navigation, next and previous links.

## Components

1. **PAGINATION (Previous/Next Buttons)**

   **Previous Button**:
   - **Regular**: Square button with light background, dark border, dark upward arrow icon centered
   - **Disabled**: Square button with dark gray background, lighter gray border, muted lighter gray upward arrow icon

   **Next Button**:
   - **Regular**: Rounded rectangular button with text "WEITER" (German for "next") and downward arrow icon. White background, dark border, dark text/icon
   - **Disabled**: Rounded rectangular button with text "WEITER" and downward arrow icon. Dark gray background, lighter gray border, muted lighter gray text/icon

2. **PAGINATION BUTTON (Page Numbers)**

   **Variants**:
   - **Teil 1**: Blue color scheme
   - **Teil 2**: Orange color scheme

   **States**:
   - **Disabled**: Thin, light gray vertical line/bar
   - **Default**: Thin, slightly darker gray vertical line/bar
   - **Active (Teil 1)**: Thin, solid blue vertical line/bar
   - **Active (Teil 2)**: Thin, solid orange vertical line/bar
   - **Hover (Teil 1)**: Thin, solid light blue vertical line/bar (lighter than active)
   - **Hover (Teil 2)**: Thin, solid light orange vertical line/bar (lighter than active)

3. **EXAMPLES (Slider/Step Indicator)**

   Vertical component representing multi-step slider or detailed page/step indicator:
   - Tall, vertical dark gray bar with segmented regions
   - Top segment labeled "01 01" highlighted in **blue**
   - Second segment labeled "02" highlighted in **orange**
   - Subsequent segments below orange are thin, light gray lines (inactive/default states)

## Design Variables

- **Colors**: Dark gray, white, muted grays, blue, orange
- **Icons**: Up/down arrows, external link
- **Typography**: Clean sans-serif
- **Interactive States**: Regular, disabled, active, hover
- **Spacing**: Consistent gaps between elements
