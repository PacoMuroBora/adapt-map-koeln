import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  plugins: [tailwindcssAnimate, typography],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'bg-dark',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
    'text-h1',
    'text-h2',
    'text-h3',
    'text-h4',
    'text-h5',
    'text-h6',
    'text-deco',
    'text-body',
    'text-body-lg',
    'text-body-sm',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '2rem',
        lg: '2rem',
        xl: '2rem',
        '2xl': '2rem',
      },
      screens: {
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '100%',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        waveform: 'waveform 0.8s ease-in-out infinite',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'var(--radius-sm)',
      },
      colors: {
        black: {
          DEFAULT: 'hsl(var(--am-dark))',
          foreground: 'hsl(var(--am-white))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        background: 'hsl(var(--background))',
        border: 'hsla(var(--border-purple))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        foreground: 'hsl(var(--foreground))',
        input: 'hsl(var(--input))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--am-green))',
        },
        ring: 'hsl(var(--ring))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        am: {
          dark: 'hsl(var(--am-dark))',
          darker: 'hsl(var(--am-darker))',
          white: 'hsl(var(--am-white))',
          green: 'hsl(var(--am-green))',
          'green-alt': 'hsl(var(--am-green-alt))',
          pink: 'hsl(var(--am-pink))',
          'pink-alt': 'hsl(var(--am-pink-alt))',
          purple: 'hsl(var(--am-purple))',
          'purple-alt': 'hsl(var(--am-purple-alt))',
          orange: 'hsl(var(--am-orange))',
          'orange-alt': 'hsl(var(--am-orange-alt))',
          turquoise: 'hsl(var(--am-turq))',
          'turquoise-alt': 'hsl(var(--am-turq-alt))',
        },
        success: 'hsl(var(--success))',
        error: 'hsl(var(--error))',
        warning: 'hsl(var(--warning))',
        // Design System Colors
        'foreground-alt': 'hsl(var(--foreground-alt))',
        'mid-alt': 'hsl(var(--mid-alt))',
        'border-purple': 'hsl(var(--border-purple))',
        'border-orange': 'hsl(var(--border-orange))',
        'border-light': 'hsl(var(--border-light))',
        ghost: 'var(--ghost)',
        'ghost-foreground': 'hsl(var(--ghost-foreground))',
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
        // Design System Font Families
        headings: ['var(--font-headings)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      fontSize: {
        base: '1rem',
        // Design system headings: fluid 320px→1440px (min→max), lineHeight as %
        h1: [
          'clamp(2.625rem, calc(2.625rem + (64 - 42) * (100vw - 320px) / 1120), 4rem)',
          { lineHeight: '105%', letterSpacing: '-0.01562em', fontWeight: 600 },
        ],
        h2: [
          'clamp(2.375rem, calc(2.375rem + (52 - 38) * (100vw - 320px) / 1120), 3.25rem)',
          { lineHeight: '105%', letterSpacing: '-0.01923em', fontWeight: 600 },
        ],
        h3: [
          'clamp(2.125rem, calc(2.125rem + (46 - 34) * (100vw - 320px) / 1120), 2.875rem)',
          { lineHeight: '105%', letterSpacing: '-0.01087em', fontWeight: 600 },
        ],
        h4: [
          'clamp(1.875rem, calc(1.875rem + (40 - 30) * (100vw - 320px) / 1120), 2.5rem)',
          { lineHeight: '120%', letterSpacing: '-0.0125em', fontWeight: 600 },
        ],
        h5: [
          'clamp(1.625rem, calc(1.625rem + (34 - 26) * (100vw - 320px) / 1120), 2.125rem)',
          { lineHeight: '110%', letterSpacing: '-0.00735em', fontWeight: 600 },
        ],
        h6: [
          'clamp(1.5rem, calc(1.5rem + (28 - 24) * (100vw - 320px) / 1120), 1.75rem)',
          { lineHeight: '120%', letterSpacing: '-0.00893em', fontWeight: 600 },
        ],
        deco: [
          'clamp(3rem, calc(3rem + (64 - 42) * (100vw - 320px) / 1120), 5rem)',
          { lineHeight: '105%', fontWeight: 600 },
        ],
        // Design system body: fixed sizes, lineHeight as %
        'body-lg': ['1.125rem', { lineHeight: '135%' }],
        body: ['1rem', { lineHeight: '130%' }],
        'body-sm': ['0.875rem', { lineHeight: '115%' }],
      },
      spacing: {
        // Design System Spacing
        '2xs': 'var(--spacing-2xs)',
        xs: 'var(--spacing-xs)',
        md: 'var(--spacing-md)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '5xl': 'var(--spacing-5xl)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
}

export default config
