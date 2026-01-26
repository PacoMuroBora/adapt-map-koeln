# Alert Dialog

**Figma**: [Alert Dialog Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-51942&p=f&m=dev)

**Location**: Not yet implemented

## Description

A modal dialog that interrupts the user with important content and expects a response.

## Variants

1. **Light Theme**
   - Background: White
   - Text: Dark black
   - Shadow: Subtle `shadow-sm`

2. **Dark Theme**
   - Background: Dark gray (`#1e1e20` or similar)
   - Text: White

## Structure

- Modal overlay covering main application content
- Central rectangular container for dialog
- Optional header with title and close button
- Main content area with primary title and descriptive message
- Footer area for action buttons (aligned right or bottom)

## Button Types

1. **Primary Action**
   - Background: Lime green (`#BEE75D` or similar)
   - Text: White
   - Usage: Main affirmative action

2. **Destructive Action**
   - Background: Orange (`#ff8429`)
   - Text: White
   - Usage: Actions with significant consequences (e.g., "DELETE")

3. **Secondary Action**
   - Light theme: Dark gray text on white (outlined, ghost, or plain text)
   - Dark theme: White text on dark gray background
   - Usage: Cancelling or going back

## Typography

- **Title**: Large, bold font (`font-title`, `font-display`)
- **Description**: Smaller, regular font (`font-body-regular`, `font-body-small`)
- **Button Text**: Medium, bold/semibold font (`font-button`)

## Spacing

- Consistent padding around content within dialog
- Vertical spacing between title, description, and button group
- Horizontal spacing between buttons

## Border Radius

Uniform `rounded-lg` or similar small radius for dialog containers and buttons

## Icons

- `X` icon for close/cancel
- Right arrow icon for continue/back

## Responsiveness

Designed to adapt to Mobile and Desktop screen sizes, adjusting width and positioning.
