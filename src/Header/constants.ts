export const SCROLL_THRESHOLD = 24
export const LOGO_HEIGHT_DEFAULT = 24
export const LOGO_HEIGHT_SCROLLED = 20
export const MOBILE_BREAKPOINT = 768

export const HEADER_HEIGHT = {
  mobile: { default: 48, scrolled: 40 },
  desktop: { default: 56, scrolled: 48 },
} as const

export const tweenTransition = {
  type: 'tween' as const,
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
}
