/**
 * Viral Clipz AI design tokens.
 * Single source of truth for color, space, type, radius, shadow, motion.
 * Never hard-code these values inside screens or components.
 */

export const colors = {
  /** Near-black midnight navy app background */
  bg: '#070B14',
  /** Slightly lifted background for scrollable sections */
  bgSubtle: '#0A101D',
  /** Elevated surfaces: cards, sheets, nav */
  surface: '#111827',
  /** Second elevation step: inputs, nested cards */
  surfaceHigh: '#1A2336',
  /** Pressed / hover state on surfaces */
  surfaceActive: '#232E47',

  /** Primary accent — electric coral-orange */
  primary: '#FF5C38',
  primarySoft: 'rgba(255, 92, 56, 0.14)',
  primaryBorder: 'rgba(255, 92, 56, 0.35)',
  onPrimary: '#FFFFFF',

  /** Secondary accent — luminous violet */
  accent: '#8B5CF6',
  accentSoft: 'rgba(139, 92, 246, 0.14)',
  accentBorder: 'rgba(139, 92, 246, 0.35)',

  /** Semantic */
  success: '#2DE3A7',
  successSoft: 'rgba(45, 227, 167, 0.13)',
  warning: '#FFB020',
  warningSoft: 'rgba(255, 176, 32, 0.13)',
  danger: '#FF4D6D',
  dangerSoft: 'rgba(255, 77, 109, 0.13)',

  /** Text */
  text: '#F4F6FB',
  textSecondary: '#B7C0D4',
  textMuted: '#7A8699',
  textDisabled: '#4B5568',

  /** Lines & overlays */
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  overlay: 'rgba(4, 7, 13, 0.72)',
  scrim: 'rgba(4, 7, 13, 0.55)',
} as const;

export const gradients = {
  /** Hero / primary CTA gradient — used sparingly */
  brand: ['#FF5C38', '#FF7A3D'] as const,
  violet: ['#8B5CF6', '#6D5CF6'] as const,
  /** Subtle card sheen for premium surfaces */
  surface: ['#141C2E', '#0E1524'] as const,
  /** Auth screen ambient backdrop */
  aurora: ['#12081F', '#070B14', '#0A1526'] as const,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  x3l: 32,
  x4l: 40,
  x5l: 56,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.8 },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const, letterSpacing: -0.2 },
  bodyLg: { fontSize: 17, lineHeight: 24, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  captionBold: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.4 },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 24,
    elevation: 12,
  },
  glowPrimary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const motion = {
  /** ms */
  fast: 140,
  base: 220,
  slow: 360,
  stagger: 60,
} as const;

export const breakpoints = {
  /** Small phones (<= iPhone SE width) */
  sm: 360,
  md: 480,
  lg: 768,
  xl: 1024,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/** Minimum touch target per accessibility guidance */
export const minTouchTarget = 44;
