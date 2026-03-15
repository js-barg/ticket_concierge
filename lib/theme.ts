/**
 * Event theme and Stripe Checkout branding.
 * Presets and helpers ensure colors work on the app and on Stripe hosted Checkout.
 */

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(color: string | null | undefined): color is string {
  return typeof color === 'string' && HEX_REGEX.test(color.trim());
}

/** Normalize to #RRGGBB for Stripe; returns undefined if invalid. */
export function normalizeHex(color: string | null | undefined): string | undefined {
  if (!color || typeof color !== 'string') return undefined;
  const t = color.trim();
  if (HEX_REGEX.test(t)) return t;
  // Allow 3-char hex
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const r = t[1] + t[1], g = t[2] + t[2], b = t[3] + t[3];
    return `#${r}${g}${b}`;
  }
  return undefined;
}

/** Preset themes that look good on the app and on Stripe Checkout. */
export const PRESET_THEMES = {
  dark_gold: {
    name: 'Dark & Gold',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#d4af37',
    background: '#0f172a',
    button: '#d4af37',
    text: 'light'
  },
  navy_white: {
    name: 'Navy & White',
    primary: '#1e3a5f',
    secondary: '#f1f5f9',
    accent: '#1e3a5f',
    background: '#1e3a5f',
    button: '#f1f5f9',
    text: 'light'
  },
  burgundy: {
    name: 'Burgundy',
    primary: '#4c1d1d',
    secondary: '#fef2f2',
    accent: '#b91c1c',
    background: '#4c1d1d',
    button: '#b91c1c',
    text: 'light'
  },
  slate: {
    name: 'Slate',
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#64748b',
    background: '#1e293b',
    button: '#64748b',
    text: 'light'
  }
} as const;

export type PresetThemeId = keyof typeof PRESET_THEMES;

/** Resolved theme with hex colors for app and Stripe. */
export type ResolvedTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  button: string;
  text: 'light' | 'dark';
};

/** Resolve event colors: use valid hex from event or fall back to preset. */
export function resolveEventTheme(options: {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  presetId?: PresetThemeId | null;
}) {
  const preset = options.presetId && PRESET_THEMES[options.presetId];
  if (preset) {
    return {
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
      background: preset.background,
      button: preset.button,
      text: preset.text as 'light' | 'dark'
    };
  }
  const primary = normalizeHex(options.primaryColor) ?? PRESET_THEMES.dark_gold.primary;
  const secondary = normalizeHex(options.secondaryColor) ?? PRESET_THEMES.dark_gold.secondary;
  const accent = normalizeHex(options.accentColor) ?? PRESET_THEMES.dark_gold.accent;
  return {
    primary,
    secondary,
    accent,
    background: primary,
    button: accent,
    text: 'light' as const
  } satisfies ResolvedTheme;
}

/** Stripe Checkout Session branding_settings (hex colors only). */
export type StripeBranding = {
  display_name?: string;
  background_color: string;
  button_color: string;
};

/** Build Stripe branding from resolved theme and optional display name. */
export function getStripeBranding(
  theme: ReturnType<typeof resolveEventTheme>,
  displayName?: string
): StripeBranding {
  return {
    ...(displayName ? { display_name: displayName } : {}),
    background_color: theme.background,
    button_color: theme.button
  };
}
