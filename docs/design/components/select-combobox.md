# Select & Combobox

**Figma**: [Select & Combobox Component](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem?node-id=842-49185&p=f&m=dev)

**Location**: `src/components/ui/select.tsx`

## States

- **Default**: Light grey border, white background
- **Hover**: Similar to default
- **Focus**: Prominent purple outline (`#6B21A8` or similar vibrant purple)
- **Disabled**: Light gray, reduced opacity

## Variants

1. **Select an item** (placeholder): Basic select fields
2. **Text input**: Combobox fields allowing text entry
3. **Search / Remove**: Comboboxes with search functionality and clear/remove button
4. **Icon left / right**: Fields with icon on left or right alongside text
5. **Clearable**: Fields with clear button (x icon)
6. **Add new item**: Field type suggesting adding new item when input doesn't match existing options
7. **Error state**: Orange border and placeholder text "Please fill out this field"
8. **Dropdown item**: Styling of individual items within dropdown

## Right Decoration Icons

- Chevron-down icon (dropdown indicator)
- X icon (clear/close button)
- Search icon

## Menu Items

**States**:
- **Default**: White background with dark text
- **Hover**: Light green background (`#BEE75D`) with dark text
- **Active**: Solid light green background with dark text and dashed purple border

**Content Types**:
- Label
- Icon left
- Icon right
- Checkmark
- Description (smaller, muted text below main label)
- Badge (small, colored circular or pill-shaped indicator with number on right)

## Menu Group Labels

- "Group label": Standard size
- "Group label (large)": Larger font size for hierarchical organization

## Menu Overflow

Simple dash or ellipsis to indicate overflow within select menu

## Left Decoration

Various icons and decorative elements:
- Basic shapes (square, circle, diamond, star)
- Status/Action icons (checkmark, info, alert triangle)
- Common object icons (calendar, user, folder, document, pin, cog/settings)
- Avatar examples (circular image placeholders)
- Badge examples (circular number indicators)

## Usage Examples

1. Multi-select dropdown with checkboxes, selected items as chips with x buttons, search field within dropdown
2. Select field with selected items as chips with avatars and x buttons, "Add new item" option
3. Radio buttons with labels and optional additional information
4. Multi-select dropdown with checkboxes and numerical badges next to options
5. Context menu with various actions (some with icons and hotkey indicators), destructive action highlighted in red
6. Simple dropdown with text options
