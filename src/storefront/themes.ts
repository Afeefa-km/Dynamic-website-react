import type { CSSProperties } from 'react'
import type { StoreTheme } from '../constants/enums'

/**
 * Store website themes. A theme is presentation only: design tokens (colours, fonts, corners, heading style)
 * plus a few layout choices for the home page. All themes render the same components with the same features,
 * so an owner can switch whenever they like without losing anything.
 *
 * The "Dress" themes take their direction from fashion e-commerce concepts the product team picked;
 * names and copy are our own.
 */
export interface ThemeDefinition {
  id: StoreTheme
  name: string
  /** Groups themes in the picker */
  category: 'Default' | 'Dress'
  description: string
  /** Home page hero layout; 'none' keeps the page straight to products */
  hero: 'none' | 'editorial' | 'banner' | 'split' | 'atelier'
  /** How many of the store's cover images the home page hero shows (owners can upload up to MAX_COVER_IMAGES) */
  coverSlots: number
  /** Thin strip above the header with delivery and payment notes */
  serviceBar: boolean
  /** Google Fonts families to load, or null when the theme only uses system fonts */
  fonts: string | null
  tokens: Record<string, string>
}

const SYSTEM_SANS = '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const THEMES: Record<StoreTheme, ThemeDefinition> = {
  Classic: {
    id: 'Classic',
    coverSlots: 0,
    name: 'Classic',
    category: 'Default',
    description: 'Clean black and white with a serif wordmark. Straight to the products.',
    hero: 'none',
    serviceBar: false,
    fonts: null,
    tokens: {
      bg: '#ffffff', surface: '#f5f5f5', text: '#171717', muted: '#525252', subtle: '#a3a3a3',
      border: '#e5e5e5', line: '#d4d4d4', primary: '#171717', 'on-primary': '#ffffff',
      accent: '#171717', 'on-accent': '#ffffff', band: '#fafafa', 'on-band': '#171717', sale: '#b91c1c',
      'font-display': 'ui-serif, Georgia, Cambria, "Times New Roman", serif', 'font-body': SYSTEM_SANS, 'font-label': SYSTEM_SANS,
      radius: '0px', 'radius-btn': '0px', 'heading-weight': '400', 'heading-case': 'none', 'heading-tracking': '0.04em',
    },
  },
  Sage: {
    id: 'Sage',
    coverSlots: 1,
    name: 'Sage',
    category: 'Dress',
    description: 'Soft sage and cream with bold uppercase headlines and lime accents. Modern and confident.',
    hero: 'editorial',
    serviceBar: false,
    fonts: 'Archivo:wght@400;500;600;700;800',
    tokens: {
      bg: '#f4f6ee', surface: '#e7ebdf', text: '#1c2117', muted: '#545b4b', subtle: '#9aa08f',
      border: '#dde2d2', line: '#c5ccb7', primary: '#1c2117', 'on-primary': '#f4f6ee',
      accent: '#c6f43c', 'on-accent': '#1c2117', band: '#23362a', 'on-band': '#eef3e4', sale: '#b42318',
      'font-display': '"Archivo", ' + SYSTEM_SANS, 'font-body': '"Archivo", ' + SYSTEM_SANS, 'font-label': '"Archivo", ' + SYSTEM_SANS,
      radius: '6px', 'radius-btn': '9999px', 'heading-weight': '700', 'heading-case': 'uppercase', 'heading-tracking': '-0.01em',
    },
  },
  Noir: {
    id: 'Noir',
    coverSlots: 1,
    name: 'Noir',
    category: 'Dress',
    description: 'Dark, moody and premium with copper highlights and a service bar up top.',
    hero: 'banner',
    serviceBar: true,
    fonts: 'Jost:wght@300;400;500;600',
    tokens: {
      bg: '#111111', surface: '#1d1d1d', text: '#f3eee7', muted: '#b4ada3', subtle: '#77716a',
      border: '#2b2b2b', line: '#3d3d3d', primary: '#f3eee7', 'on-primary': '#111111',
      accent: '#d08548', 'on-accent': '#111111', band: '#191919', 'on-band': '#f3eee7', sale: '#f28b6b',
      'font-display': '"Jost", ' + SYSTEM_SANS, 'font-body': '"Jost", ' + SYSTEM_SANS, 'font-label': '"Jost", ' + SYSTEM_SANS,
      radius: '2px', 'radius-btn': '2px', 'heading-weight': '300', 'heading-case': 'none', 'heading-tracking': '0em',
    },
  },
  Blush: {
    id: 'Blush',
    coverSlots: 3,
    name: 'Blush',
    category: 'Dress',
    description: 'Romantic pastels, sage and blush, with an elegant serif. Made for dresses and accessories.',
    hero: 'split',
    serviceBar: false,
    fonts: 'Marcellus&family=Jost:wght@300;400;500',
    tokens: {
      bg: '#f6f0e9', surface: '#ece2d7', text: '#5a5732', muted: '#7d7856', subtle: '#ada88c',
      border: '#e2d7c9', line: '#cfc3b2', primary: '#5a5732', 'on-primary': '#f6f0e9',
      accent: '#d9a493', 'on-accent': '#3d3a1e', band: '#cfdcca', 'on-band': '#5a5732', sale: '#a0402c',
      'font-display': '"Marcellus", ui-serif, Georgia, serif', 'font-body': '"Jost", ' + SYSTEM_SANS, 'font-label': '"Jost", ' + SYSTEM_SANS,
      radius: '4px', 'radius-btn': '0px', 'heading-weight': '400', 'heading-case': 'uppercase', 'heading-tracking': '0.08em',
    },
  },
  Atelier: {
    id: 'Atelier',
    coverSlots: 2,
    name: 'Atelier',
    category: 'Dress',
    description: 'Retro editorial: warm cream, wide display type, mono labels and a burnt-orange call to action.',
    hero: 'atelier',
    serviceBar: false,
    fonts: 'Michroma&family=IBM+Plex+Mono:wght@400;500',
    tokens: {
      bg: '#efe8dc', surface: '#e4dbcc', text: '#161616', muted: '#5f584d', subtle: '#9b9284',
      border: '#d9cfbf', line: '#bfb4a2', primary: '#d4602c', 'on-primary': '#ffffff',
      accent: '#d4602c', 'on-accent': '#ffffff', band: '#161616', 'on-band': '#efe8dc', sale: '#b4401b',
      'font-display': '"Michroma", ' + SYSTEM_SANS, 'font-body': SYSTEM_SANS, 'font-label': '"IBM Plex Mono", ui-monospace, monospace',
      radius: '0px', 'radius-btn': '0px', 'heading-weight': '400', 'heading-case': 'uppercase', 'heading-tracking': '0.02em',
    },
  },
}

/** Keep in sync with CoreConstants.Media.MaxStoreCoverImages on the API */
export const MAX_COVER_IMAGES = 3

export const themeList = Object.values(THEMES)

export const resolveTheme = (id: string | null | undefined): ThemeDefinition =>
  (id && id in THEMES ? THEMES[id as StoreTheme] : THEMES.Classic)

/** The theme's tokens as CSS custom properties, for the storefront root (or a preview). */
export const themeStyle = (theme: ThemeDefinition) =>
  Object.fromEntries(Object.entries(theme.tokens).map(([k, v]) => [`--sf-${k}`, v])) as CSSProperties

/** Adds the theme's web fonts to the page once. Safe to call repeatedly. */
export function loadThemeFonts(theme: ThemeDefinition) {
  if (!theme.fonts || typeof document === 'undefined') return
  const id = `sf-fonts-${theme.id}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap`
  document.head.appendChild(link)
}
