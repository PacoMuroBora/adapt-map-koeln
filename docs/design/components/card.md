# Card

**Figma**: [Card Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-49175&p=f&m=dev)

**Location**: `src/components/ui/card.tsx`

## Description

Displays a card with header, content, and footer. Uses a slot system for flexible content arrangement.

## Structure

- **Card**: Container with rounded corners, border, background, and shadow
- **CardHeader**: Header section with title and optional description
- **CardTitle**: Bold, dark text title
- **CardDescription**: Smaller, regular weight dark text
- **CardContent**: Main content area
- **CardFooter**: Footer section for actions or additional content

## Slot System

Cards support 1, 2, or 3 content slots, allowing flexible layouts:
- **1 slot**: Single content area
- **2 slots**: Two content areas (stacked vertically)
- **3 slots**: Three content areas (stacked vertically)

## Color Variants

- **Purple**: Light lavender/purple background (`#DBCBFD`), dark gray border, dark text
- **Orange**: Light orange/peach background (`#FFD8BE`), dark gray border, dark text
- **White**: White background, light gray dashed border, dark text

## Design Variables

- **Border Radius**: `rounded-lg` (moderate rounding)
- **Shadow**: Subtle shadow beneath card (elevation)
- **Background**: Predominantly white or very light colors, with specific examples using light purple or light orange
- **Padding**: Generous padding around content within cards
- **Typography**: Clean sans-serif font, titles bold, descriptions regular

## Usage Examples

1. **Contact Form Card**: Title, description, form fields (Name, Email, Category, Message)
2. **Login Card**: Title, description, email/password inputs, action buttons
3. **Image Card**: Title, description, image, footer with labels and price
4. **Meeting Notes Card**: Title, date, content text, footer with avatars
5. **Postal Code Card** (Purple): German text, circular input fields
6. **Question Card** (Orange): German text, Yes/No buttons with icons
