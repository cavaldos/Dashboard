export type FontFamilyKey =
  | 'geist'
  | 'terminal'
  | 'monaco'
  | 'jetbrains'
  | 'fira'
  | 'ibm'
  | 'space'
  | 'comic'
  | 'winky'
  | 'sans';

type FontFamilyDefinition = {
  label: string;
  mono: string;
  sans: string;
};

type FontFamilyConfig = {
  defaultFamily: FontFamilyKey;
  families: Record<FontFamilyKey, FontFamilyDefinition>;
};

export const FONT_FAMILY_STORAGE_KEY = 'ui-font-family';

export const FONT_FAMILY_CONFIG: FontFamilyConfig = {
  defaultFamily: 'geist',
  families: {
    geist: {
      label: 'Geist + Rajdhani',
      mono: "'Geist Mono', 'Share Tech Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    terminal: {
      label: 'Share Tech + Rajdhani',
      mono: "'Share Tech Mono', 'Geist Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    monaco: {
      label: 'Monaco',
      mono: "'Monaco', 'Menlo', 'Consolas', 'Geist Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    jetbrains: {
      label: 'JetBrains Mono',
      mono: "'JetBrains Mono', 'Geist Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    fira: {
      label: 'Fira Code',
      mono: "'Fira Code', 'Geist Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    ibm: {
      label: 'IBM Plex Mono',
      mono: "'IBM Plex Mono', 'Geist Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    space: {
      label: 'Space Mono',
      mono: "'Space Mono', 'Geist Mono', monospace",
      sans: "'Rajdhani', sans-serif",
    },
    comic: {
      label: 'Comic Relief',
      mono: "'Comic Relief', 'Geist Mono', monospace",
      sans: "'Comic Relief', 'Rajdhani', sans-serif",
    },
    winky: {
      label: 'Winky Sans',
      mono: "'Winky Sans', 'Geist Mono', sans-serif",
      sans: "'Winky Sans', 'Rajdhani', sans-serif",
    },
    sans: {
      label: 'Rajdhani Focus',
      mono: "'Rajdhani', 'Geist Mono', sans-serif",
      sans: "'Rajdhani', sans-serif",
    },
  },
};

export const fontFamilyKeys = Object.keys(FONT_FAMILY_CONFIG.families) as FontFamilyKey[];

export const normalizeFontFamily = (value: string | null | undefined): FontFamilyKey => {
  if (!value || !fontFamilyKeys.includes(value as FontFamilyKey)) {
    return FONT_FAMILY_CONFIG.defaultFamily;
  }

  return value as FontFamilyKey;
};

export const applyFontFamily = (family: FontFamilyKey) => {
  if (typeof document === 'undefined') {
    return;
  }

  const selectedFamily = FONT_FAMILY_CONFIG.families[family];
  document.documentElement.style.setProperty('--mono', selectedFamily.mono);
  document.documentElement.style.setProperty('--sans', selectedFamily.sans);
};
