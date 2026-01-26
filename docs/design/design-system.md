# AdaptMap Design System

This document outlines the design system rules and component specifications for the AdaptMap Köln project. The design system is based on shadcn/ui components and aligned with Figma designs from the "AdaptMap Designsystem" file.

**Figma File**: [AdaptMap Designsystem](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem)

## Table of Contents

1. [Elemental Design Variables](#elemental-design-variables)
   - [Colors](#colors)
   - [Typography](#typography)
   - [Spacing](#spacing)
   - [Border Radius](#border-radius)
2. [Components](#components)
   - [Button](./components/button.md)
   - [Icon Button](./components/icon-button.md)
   - [Link Button](./components/link-button.md)
   - [Card](./components/card.md)
   - [Alert](./components/alert.md)
   - [Alert Dialog](./components/alert-dialog.md)
   - [Field](./components/field.md)
   - [Input](./components/input.md)
   - [Input Group](./components/input-group.md)
   - [Input OTP](./components/input-otp.md)
   - [Textarea](./components/textarea.md)
   - [Select & Combobox](./components/select-combobox.md)
   - [Radio](./components/radio.md)
   - [Radio Fancy](./components/radio-fancy.md)
   - [Slider](./components/slider.md)
   - [Skeleton](./components/skeleton.md)
   - [Pagination](./components/pagination.md)
   - [Stateful Info Box](./components/stateful-info-box.md)

---

## Elemental Design Variables

### Global CSS Variables

These variables should be added to `src/app/(frontend)/globals.css` in the `:root` selector for global use across all components.

#### Colors

Based on Figma variable definitions, the design system uses the following color tokens:

**Figma Variables → CSS Variables Mapping:**

```css
:root {
  /* Primary Colors */
  --foreground: 222.2 84% 4.9%; /* #141418 - general/foreground */
  --foreground-alt: 215 20% 35%; /* #4a5768 - unofficial/foreground alt */
  --mid-alt: 215 25% 40%; /* #475569 - unofficial/mid alt */
  
  /* Border Colors */
  --border: 252 100% 80%; /* #9f94ff - general/border (purple) */
  
  /* Ghost/Transparent */
  --ghost: transparent; /* #ffffff00 - unofficial/ghost */
  --ghost-foreground: 222.2 84% 4.9%; /* #141418 - unofficial/ghost foreground */
  
  /* Brand Colors (for reference, map to semantic tokens) */
  --am-dark: 0 0% 12%; /* #1e1e20 */
  --am-darker: 0 0% 8%; /* #141418 */
  --am-white: 60 20% 98%; /* #fffef8 */
  --am-purple-alt: 252 100% 80%; /* #9f94ff */
  --am-orange-alt: 20 100% 58%; /* #ff8429 */
}
```

**Tailwind Usage:**
- `text-foreground` → `#141418` (primary text)
- `text-foreground-alt` → `#4a5768` (muted text)
- `border-border` → `#9f94ff` (purple border)
- `bg-ghost` → transparent background
- `text-ghost-foreground` → `#141418` (text on ghost)

#### Semantic Colors

- **general/foreground**: `#141418` - Primary text color → `text-foreground`
- **general/primary foreground**: `#fffef8` - Text on primary backgrounds → `text-primary-foreground`
- **general/muted foreground**: `#4a5768` - Muted text color → `text-muted-foreground`
- **general/border**: `#9f94ff` - Border color → `border-border`
- **unofficial/foreground alt**: `#4a5768` - Alternative foreground → `text-foreground-alt`
- **unofficial/mid alt**: `#475569` - Mid-tone alternative → `text-mid-alt`
- **unofficial/ghost**: `#ffffff00` - Transparent/ghost background → `bg-ghost`
- **unofficial/ghost foreground**: `#141418` - Ghost text color → `text-ghost-foreground`
- **unofficial/body background**: `#ffffff` - Body background → `bg-background`

#### Interactive States
- **Primary (Lime Green)**: Used for primary actions, checkmarks, active states → `bg-primary` / `text-primary-foreground`
- **Destructive (Orange/Red)**: Used for destructive actions, errors → `bg-destructive` / `text-destructive-foreground`
- **Focus Ring**: Blue-gray/purple outline for focus states → `ring-ring` (currently `#141418`, may need adjustment)

### Typography

#### Font Families

**Figma Variables:**
- **font-family-headings**: `LT Institute` → CSS: `var(--font-headings)` or Tailwind: `font-headings`
- **font-family-body**: `Uncut Sans` → CSS: `var(--font-body)` or Tailwind: `font-body`
- **font-family-sans**: `Uncut Sans` → CSS: `var(--font-sans)` or Tailwind: `font-sans`

**Implementation in `globals.css`:**
```css
:root {
  --font-headings: 'LT Institute', sans-serif;
  --font-body: 'Uncut Sans', sans-serif;
  --font-sans: 'Uncut Sans', sans-serif;
}
```

**Tailwind Config (`tailwind.config.mjs`):**
```js
fontFamily: {
  headings: ['var(--font-headings)'],
  body: ['var(--font-body)'],
  sans: ['var(--font-sans)'],
}
```

#### Font Styles

**Heading 1**
- **Figma Variable**: `heading 1/max`
- Font Family: `LT Institute` (`font-headings`)
- Font Size: `64px` (`text-[64px]` or custom class)
- Font Weight: `Semibold` (600) (`font-semibold`)
- Line Height: `67px` (`leading-[67px]`)
- Letter Spacing: `-1px` (`tracking-[-1px]`)
- Spacing (margin-bottom): `64px` (`mb-16` or `mb-[64px]`)

**Implementation:**
```tsx
<h1 className="font-headings text-[64px] font-semibold leading-[67px] tracking-[-1px] mb-16">
  Heading 1
</h1>
```

**Heading 3**
- Font Family: `LT Institute` (`font-headings`)
- Font Size: `46px` (`text-[46px]`)
- Font Weight: `Semibold` (600) (`font-semibold`)
- Line Height: `48px` (`leading-[48px]`)
- Letter Spacing: `-0.5px` (`tracking-[-0.5px]`)
- Spacing: `46px` (`mb-[46px]`)

**Paragraph Regular**
- **Figma Variable**: `paragraph/regular`
- Font Family: `Uncut Sans` (`font-body`)
- Font Size: `18px` (`text-lg`)
- Font Weight: `Regular` (400) (`font-normal`)
- Line Height: `24px` (`leading-6`)
- Letter Spacing: `0px` (`tracking-normal`)

**Implementation:**
```tsx
<p className="font-body text-lg font-normal leading-6">
  Paragraph text
</p>
```

**Paragraph Small**
- **Figma Variable**: `paragraph/small`
- Font Family: `Uncut Sans` (`font-body`)
- Font Size: `16px` (`text-base`)
- Font Weight: `Regular` (400) (`font-normal`)
- Line Height: `21px` (`leading-[21px]`)

**Paragraph Bold**
- Font Weight: `Semibold` (600) (`font-semibold`)
- All other properties same as Paragraph Regular

**Button Large**
- **Figma Variable**: `button/large`
- Font Family: `Uncut Sans` (`font-sans`)
- Font Size: `16px` (`text-base`)
- Font Weight: `Regular` (400) (`font-normal`)
- Line Height: `1` (`leading-none`)
- Letter Spacing: `1px` (`tracking-[1px]`)

### Spacing

**Figma Semantic Spacing Variables → Tailwind Classes:**

- **semantic/2xs**: `4px` → `gap-1`, `p-1`, `m-1`, `space-x-1`, `space-y-1`
- **semantic/xs**: `8px` → `gap-2`, `p-2`, `m-2`, `space-x-2`, `space-y-2`
- **semantic/md**: `16px` → `gap-4`, `p-4`, `m-4`, `space-x-4`, `space-y-4`
- **semantic/xl**: `24px` → `gap-6`, `p-6`, `m-6`, `space-x-6`, `space-y-6`
- **semantic/2xl**: `32px` → `gap-8`, `p-8`, `m-8`, `space-x-8`, `space-y-8`
- **semantic/5xl**: `64px` → `gap-16`, `p-16`, `m-16`, `space-x-16`, `space-y-16`

**Implementation in `globals.css` (optional, for custom spacing):**
```css
:root {
  --spacing-2xs: 4px;
  --spacing-xs: 8px;
  --spacing-md: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-5xl: 64px;
}
```

**Usage Examples:**
```tsx
{/* Gap between items */}
<div className="flex gap-2"> {/* 8px gap */}
  <Button>Item 1</Button>
  <Button>Item 2</Button>
</div>

{/* Padding */}
<div className="p-4"> {/* 16px padding */}
  Content
</div>

{/* Vertical spacing */}
<div className="space-y-6"> {/* 24px vertical gap */}
  <Card />
  <Card />
</div>
```

### Border Radius

**Figma Variables → Tailwind Classes:**

- **semantic/rounded-sm**: `4px` → `rounded-sm` (or `rounded-[4px]`)
- **semantic/rounded-lg**: `8px` → `rounded-lg` (or `rounded-[8px]`)
- **absolute/radius-8**: `8px` → `rounded-lg` (matches semantic/rounded-lg)
- **semantic/rounded-full**: `9999px` → `rounded-full`

**Implementation:**
- Default component radius: `rounded-lg` (8px) - matches `--radius` in globals.css
- Small radius: `rounded-sm` (4px)
- Full radius: `rounded-full` (for pills/circles)

**Usage Examples:**
```tsx
{/* Button with rounded corners */}
<Button className="rounded-lg">Click me</Button>

{/* Fully rounded button (pill shape) */}
<Button className="rounded-full">Pill Button</Button>

{/* Input with small radius */}
<Input className="rounded-sm" />
```

---

## Components

Each component has its own documentation file in the `components/` directory. Click on any component name to view its detailed specification:

- **[Button](./components/button.md)** - Primary, secondary, outline, destructive, and ghost variants with multiple sizes and shapes
- **[Icon Button](./components/icon-button.md)** - Icon-only button variants
- **[Link Button](./components/link-button.md)** - Text link styled as button with underline on hover
- **[Card](./components/card.md)** - Container component with header, content, and footer slots
- **[Alert](./components/alert.md)** - Callout component with neutral, error, and success variants
- **[Alert Dialog](./components/alert-dialog.md)** - Modal dialog for important user interactions
- **[Field](./components/field.md)** - Form field wrapper with label support
- **[Input](./components/input.md)** - Text input with multiple sizes, shapes, and states
- **[Input Group](./components/input-group.md)** - Grouped input elements with prefixes, suffixes, and icons
- **[Input OTP](./components/input-otp.md)** - One-Time Password input with individual digit fields
- **[Textarea](./components/textarea.md)** - Multi-line text input with resize handle
- **[Select & Combobox](./components/select-combobox.md)** - Dropdown and combobox components with search
- **[Radio](./components/radio.md)** - Radio button group with icon and label support
- **[Radio Fancy](./components/radio-fancy.md)** - Stylized radio buttons as card-like buttons with icons
- **[Slider](./components/slider.md)** - Range input with vertical and horizontal orientations
- **[Skeleton](./components/skeleton.md)** - Loading placeholders for content
- **[Pagination](./components/pagination.md)** - Page navigation with previous/next buttons
- **[Stateful Info Box](./components/stateful-info-box.md)** - Configurable list item with optional icons, text lines, and action buttons

---

## Global Variables Reference

This section provides a quick reference for all global design variables extracted from Figma, mapped to CSS variables and Tailwind classes.

### Complete CSS Variables Setup

Add these to `src/app/(frontend)/globals.css` in the `:root` selector:

```css
:root {
  /* Colors - Foreground */
  --foreground: 222.2 84% 4.9%; /* #141418 - general/foreground */
  --foreground-alt: 215 20% 35%; /* #4a5768 - unofficial/foreground alt */
  --mid-alt: 215 25% 40%; /* #475569 - unofficial/mid alt */
  
  /* Colors - Borders */
  --border: 252 100% 80%; /* #9f94ff - general/border (purple) */
  
  /* Colors - Ghost/Transparent */
  --ghost: transparent; /* #ffffff00 - unofficial/ghost */
  --ghost-foreground: 222.2 84% 4.9%; /* #141418 - unofficial/ghost foreground */
  
  /* Colors - Brand (for reference) */
  --am-dark: 0 0% 12%; /* #1e1e20 */
  --am-darker: 0 0% 8%; /* #141418 */
  --am-white: 60 20% 98%; /* #fffef8 */
  --am-purple-alt: 252 100% 80%; /* #9f94ff */
  --am-orange-alt: 20 100% 58%; /* #ff8429 */
  
  /* Typography - Font Families */
  --font-headings: 'LT Institute', sans-serif;
  --font-body: 'Uncut Sans', sans-serif;
  --font-sans: 'Uncut Sans', sans-serif;
  
  /* Typography - Heading 1 */
  --heading-1-size: 64px;
  --heading-1-weight: 600;
  --heading-1-line-height: 67px;
  --heading-1-letter-spacing: -1px;
  --heading-1-spacing: 64px;
  
  /* Typography - Heading 3 */
  --heading-3-size: 46px;
  --heading-3-weight: 600;
  --heading-3-line-height: 48px;
  --heading-3-letter-spacing: -0.5px;
  --heading-3-spacing: 46px;
  
  /* Typography - Paragraph Regular */
  --paragraph-regular-size: 18px;
  --paragraph-regular-weight: 400;
  --paragraph-regular-line-height: 24px;
  --paragraph-regular-letter-spacing: 0px;
  
  /* Typography - Paragraph Small */
  --paragraph-small-size: 16px;
  --paragraph-small-weight: 400;
  --paragraph-small-line-height: 21px;
  
  /* Typography - Button Large */
  --button-large-size: 16px;
  --button-large-weight: 400;
  --button-large-line-height: 1;
  --button-large-letter-spacing: 1px;
  
  /* Spacing */
  --spacing-2xs: 4px;
  --spacing-xs: 8px;
  --spacing-md: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-5xl: 64px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-lg: 8px;
  --radius-full: 9999px;
}
```

### Tailwind Config Extensions

Add these to `tailwind.config.mjs` in the `theme.extend` section:

```js
theme: {
  extend: {
    colors: {
      'foreground-alt': 'hsl(var(--foreground-alt))',
      'mid-alt': 'hsl(var(--mid-alt))',
      'ghost': 'var(--ghost)',
      'ghost-foreground': 'hsl(var(--ghost-foreground))',
      'am-dark': 'hsl(var(--am-dark))',
      'am-darker': 'hsl(var(--am-darker))',
      'am-white': 'hsl(var(--am-white))',
      'am-purple-alt': 'hsl(var(--am-purple-alt))',
      'am-orange-alt': 'hsl(var(--am-orange-alt))',
    },
    fontFamily: {
      headings: ['var(--font-headings)'],
      body: ['var(--font-body)'],
      sans: ['var(--font-sans)'],
    },
    spacing: {
      '2xs': 'var(--spacing-2xs)',
      'xs': 'var(--spacing-xs)',
      'md': 'var(--spacing-md)',
      'xl': 'var(--spacing-xl)',
      '2xl': 'var(--spacing-2xl)',
      '5xl': 'var(--spacing-5xl)',
    },
    borderRadius: {
      'sm': 'var(--radius-sm)',
      'lg': 'var(--radius-lg)',
    },
  },
}
```

### Quick Reference Table

| Figma Variable | CSS Variable | Tailwind Class | Value |
|---------------|--------------|---------------|-------|
| `general/foreground` | `--foreground` | `text-foreground` | `#141418` |
| `unofficial/foreground alt` | `--foreground-alt` | `text-foreground-alt` | `#4a5768` |
| `general/border` | `--border` | `border-border` | `#9f94ff` |
| `semantic/xs` | `--spacing-xs` | `gap-2`, `p-2` | `8px` |
| `semantic/md` | `--spacing-md` | `gap-4`, `p-4` | `16px` |
| `semantic/2xl` | `--spacing-2xl` | `gap-8`, `p-8` | `32px` |
| `semantic/rounded-lg` | `--radius-lg` | `rounded-lg` | `8px` |
| `font-family-headings` | `--font-headings` | `font-headings` | `LT Institute` |
| `font-family-body` | `--font-body` | `font-body` | `Uncut Sans` |

### Usage Examples

```tsx
{/* Using semantic colors */}
<div className="bg-background text-foreground border-border">
  Content
</div>

{/* Using semantic spacing */}
<div className="p-4 gap-2 space-y-6">
  <Card />
  <Card />
</div>

{/* Using typography */}
<h1 className="font-headings text-[64px] font-semibold leading-[67px] tracking-[-1px]">
  Heading
</h1>

<p className="font-body text-lg leading-6">
  Paragraph text
</p>

{/* Using border radius */}
<Button className="rounded-lg">Button</Button>
```

---

## Implementation Guidelines

### Color Conversion

When converting from Figma hex values to code:

1. **Map to semantic variables**: `bg-[#4e36f5]` → `bg-primary` (if `--primary` matches)
2. **Use Tailwind utilities**: `bg-primary`, `text-primary-foreground`, `border-border`
3. **Preserve spacing**: Keep Figma spacing values if they align with design system

### Typography

1. **Use semantic font classes** first: `font-button`, `font-body-regular`, etc.
2. **Fallback to Tailwind primitives** if no semantic class exists
3. **Match Figma font styles** exactly

### Spacing

1. **Use Tailwind spacing scale**: `p-4`, `gap-2`, `space-y-4`
2. **Match Figma measurements** when specified
3. **Maintain consistency** across similar components

### Component Creation Rules

1. **Always start from shadcn/ui** when a base component exists
2. **Use semantic CSS variables** instead of hardcoded values
3. **Follow Figma design specifications** for spacing, colors, and typography
4. **Maintain accessibility** standards from shadcn components
5. **Use TypeScript** with proper prop interfaces

---

## References

- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Component Source**: `src/components/ui/`
- **Design Tokens**: `src/app/(frontend)/globals.css`
- **Figma File**: [AdaptMap Designsystem](https://www.figma.com/design/SAFZI8SsNAwUMo8vZm9DwD/AdaptMap-Designsystem)
