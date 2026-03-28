export type ThemeKey = 'blue' | 'olive' | 'midnight' | 'gruv' | 'hacker' | 'latte' | 'onedark';

type ThemeDefinition = {
  label: string;
  vars: Record<string, string>;
};

type ThemeConfig = {
  defaultTheme: ThemeKey;
  themes: Record<ThemeKey, ThemeDefinition>;
};

export const THEME_STORAGE_KEY = 'ui-theme';

export const THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'blue',
  themes: {
    blue: {
      label: 'Blue',
      vars: {
        '--bg-base': '#080c10',
        '--bg-card': '#0b1017',
        '--bg-card-hover': '#0f1620',
        '--border': '#1e3448',
        '--border-bright': '#2a4a6b',
        '--accent': '#4a9eff',
        '--accent-dim': '#1a4a7a',
        '--accent-glow': 'rgba(74, 158, 255, 0.15)',
        '--text-primary': '#c8d8e8',
        '--text-secondary': '#6a8a9a',
        '--text-dim': '#3a5a6a',
        '--green': '#2aff8a',
        '--red': '#ff4a4a',
        '--yellow': '#ffcc44',
        '--bg-radial-1': 'rgba(10, 30, 60, 0.4)',
        '--bg-radial-2': 'rgba(5, 20, 40, 0.3)',
        '--accent-strong': 'rgba(74, 158, 255, 0.8)',
        '--green-soft': 'rgba(42, 255, 138, 0.3)',
        '--red-soft': 'rgba(255, 74, 74, 0.3)',
        '--red-muted': 'rgba(255, 74, 74, 0.1)',
        '--red-shadow': 'rgba(255, 74, 74, 0.2)',
        '--table-border-soft': 'rgba(30, 52, 72, 0.5)',
        '--table-row-hover': 'rgba(74, 158, 255, 0.03)',
        '--header-overlay-from': 'rgba(8, 12, 16, 0.95)',
        '--header-overlay-to': 'rgba(8, 12, 16, 0.82)',
      },
    },
    olive: {
      label: 'Olive',
      vars: {
        '--bg-base': '#0d0f0e',
        '--bg-card': '#111410',
        '--bg-card-hover': '#171a15',
        '--border': '#2a2e28',
        '--border-bright': '#3d4438',
        '--accent': '#8a9e7a',
        '--accent-dim': '#2e3828',
        '--accent-glow': 'rgba(138, 158, 122, 0.10)',
        '--text-primary': '#b8c4a8',
        '--text-secondary': '#6a7860',
        '--text-dim': '#3a4232',
        '--green': '#7abf6a',
        '--red': '#bf6a5a',
        '--yellow': '#bfaa5a',
        '--bg-radial-1': 'rgba(20, 28, 15, 0.5)',
        '--bg-radial-2': 'rgba(15, 20, 10, 0.4)',
        '--accent-strong': 'rgba(138, 158, 122, 0.8)',
        '--green-soft': 'rgba(122, 191, 106, 0.3)',
        '--red-soft': 'rgba(191, 106, 90, 0.3)',
        '--red-muted': 'rgba(191, 106, 90, 0.1)',
        '--red-shadow': 'rgba(191, 106, 90, 0.2)',
        '--table-border-soft': 'rgba(42, 46, 40, 0.6)',
        '--table-row-hover': 'rgba(138, 158, 122, 0.05)',
        '--header-overlay-from': 'rgba(13, 15, 14, 0.95)',
        '--header-overlay-to': 'rgba(13, 15, 14, 0.82)',
      },
    },
    midnight: {
      label: 'Midnight',
      vars: {
        '--bg-base': '#0d0d14',
        '--bg-card': '#10111b',
        '--bg-card-hover': '#141828',
        '--border': '#262a41',
        '--border-bright': '#394066',
        '--accent': '#8ea2ff',
        '--accent-dim': '#2a3260',
        '--accent-glow': 'rgba(142, 162, 255, 0.14)',
        '--text-primary': '#ced3ea',
        '--text-secondary': '#8d96bd',
        '--text-dim': '#565f85',
        '--green': '#8fe4a8',
        '--red': '#ff7d86',
        '--yellow': '#e9c37d',
        '--bg-radial-1': 'rgba(18, 23, 63, 0.45)',
        '--bg-radial-2': 'rgba(8, 12, 38, 0.35)',
        '--accent-strong': 'rgba(142, 162, 255, 0.82)',
        '--green-soft': 'rgba(143, 228, 168, 0.35)',
        '--red-soft': 'rgba(255, 125, 134, 0.34)',
        '--red-muted': 'rgba(255, 125, 134, 0.14)',
        '--red-shadow': 'rgba(255, 125, 134, 0.24)',
        '--table-border-soft': 'rgba(57, 64, 102, 0.55)',
        '--table-row-hover': 'rgba(142, 162, 255, 0.06)',
        '--header-overlay-from': 'rgba(13, 13, 20, 0.95)',
        '--header-overlay-to': 'rgba(13, 13, 20, 0.82)',
      },
    },
    gruv: {
      label: 'Gruv',
      vars: {
        '--bg-base': '#1d2021',
        '--bg-card': '#282828',
        '--bg-card-hover': '#32302f',
        '--border': '#504945',
        '--border-bright': '#665c54',
        '--accent': '#d79921',
        '--accent-dim': '#7c6f3e',
        '--accent-glow': 'rgba(215, 153, 33, 0.14)',
        '--text-primary': '#ebdbb2',
        '--text-secondary': '#bdae93',
        '--text-dim': '#928374',
        '--green': '#b8bb26',
        '--red': '#fb4934',
        '--yellow': '#fabd2f',
        '--bg-radial-1': 'rgba(69, 63, 47, 0.38)',
        '--bg-radial-2': 'rgba(47, 41, 31, 0.32)',
        '--accent-strong': 'rgba(250, 189, 47, 0.86)',
        '--green-soft': 'rgba(184, 187, 38, 0.32)',
        '--red-soft': 'rgba(251, 73, 52, 0.34)',
        '--red-muted': 'rgba(251, 73, 52, 0.14)',
        '--red-shadow': 'rgba(251, 73, 52, 0.24)',
        '--table-border-soft': 'rgba(102, 92, 84, 0.55)',
        '--table-row-hover': 'rgba(215, 153, 33, 0.08)',
        '--header-overlay-from': 'rgba(29, 32, 33, 0.95)',
        '--header-overlay-to': 'rgba(29, 32, 33, 0.82)',
      },
    },
    hacker: {
      label: 'Hacker',
      vars: {
        '--bg-base': '#040705',
        '--bg-card': '#070d09',
        '--bg-card-hover': '#0b140f',
        '--border': '#173126',
        '--border-bright': '#23503b',
        '--accent': '#33ff99',
        '--accent-dim': '#1d7a4f',
        '--accent-glow': 'rgba(51, 255, 153, 0.16)',
        '--text-primary': '#b9f4d5',
        '--text-secondary': '#6db596',
        '--text-dim': '#3f6f5a',
        '--green': '#6effb0',
        '--red': '#ff5f7a',
        '--yellow': '#e6ff5a',
        '--bg-radial-1': 'rgba(8, 45, 26, 0.45)',
        '--bg-radial-2': 'rgba(5, 24, 15, 0.36)',
        '--accent-strong': 'rgba(51, 255, 153, 0.88)',
        '--green-soft': 'rgba(110, 255, 176, 0.35)',
        '--red-soft': 'rgba(255, 95, 122, 0.35)',
        '--red-muted': 'rgba(255, 95, 122, 0.13)',
        '--red-shadow': 'rgba(255, 95, 122, 0.23)',
        '--table-border-soft': 'rgba(35, 80, 59, 0.52)',
        '--table-row-hover': 'rgba(51, 255, 153, 0.07)',
        '--header-overlay-from': 'rgba(4, 7, 5, 0.95)',
        '--header-overlay-to': 'rgba(4, 7, 5, 0.82)',
      },
    },
    latte: {
      label: 'Latte',
      vars: {
        '--bg-base': '#e8dfd0',
        '--bg-card': '#f2ebe0',
        '--bg-card-hover': '#e5ddd0',
        '--border': '#b8a68f',
        '--border-bright': '#9c866c',
        '--accent': '#8c4a28',
        '--accent-dim': '#c4a68c',
        '--accent-glow': 'rgba(140, 74, 40, 0.1)',
        '--text-primary': '#2a1a10',
        '--text-secondary': '#5a4230',
        '--text-dim': '#7a6250',
        '--green': '#2a7a58',
        '--red': '#a33028',
        '--yellow': '#7a5a18',
        '--bg-radial-1': 'rgba(180, 140, 100, 0.15)',
        '--bg-radial-2': 'rgba(210, 180, 140, 0.25)',
        '--accent-strong': 'rgba(140, 74, 40, 0.65)',
        '--green-soft': 'rgba(42, 122, 88, 0.25)',
        '--red-soft': 'rgba(163, 48, 40, 0.25)',
        '--red-muted': 'rgba(163, 48, 40, 0.1)',
        '--red-shadow': 'rgba(163, 48, 40, 0.15)',
        '--table-border-soft': 'rgba(160, 130, 100, 0.5)',
        '--table-row-hover': 'rgba(140, 74, 40, 0.06)',
        '--header-overlay-from': 'rgba(232, 223, 208, 0.96)',
        '--header-overlay-to': 'rgba(228, 221, 208, 0.88)',
      },
    },
    onedark: {
      label: 'One Dark',
      vars: {
        '--bg-base': '#21252b',
        '--bg-card': '#282c34',
        '--bg-card-hover': '#2f343f',
        '--border': '#3e4451',
        '--border-bright': '#4b5363',
        '--accent': '#61afef',
        '--accent-dim': '#2f4a69',
        '--accent-glow': 'rgba(97, 175, 239, 0.15)',
        '--text-primary': '#abb2bf',
        '--text-secondary': '#8b93a2',
        '--text-dim': '#5c6370',
        '--green': '#98c379',
        '--red': '#e06c75',
        '--yellow': '#e5c07b',
        '--bg-radial-1': 'rgba(70, 86, 112, 0.3)',
        '--bg-radial-2': 'rgba(45, 52, 64, 0.25)',
        '--accent-strong': 'rgba(97, 175, 239, 0.83)',
        '--green-soft': 'rgba(152, 195, 121, 0.32)',
        '--red-soft': 'rgba(224, 108, 117, 0.32)',
        '--red-muted': 'rgba(224, 108, 117, 0.12)',
        '--red-shadow': 'rgba(224, 108, 117, 0.2)',
        '--table-border-soft': 'rgba(75, 83, 99, 0.56)',
        '--table-row-hover': 'rgba(97, 175, 239, 0.06)',
        '--header-overlay-from': 'rgba(33, 37, 43, 0.95)',
        '--header-overlay-to': 'rgba(33, 37, 43, 0.82)',
      },
    },
  },
};

const LEGACY_THEME_MAP: Record<string, ThemeKey> = {
  demo: 'blue',
  demo2: 'olive',
};

export const themeKeys = Object.keys(THEME_CONFIG.themes) as ThemeKey[];

export const normalizeTheme = (value: string | null | undefined): ThemeKey => {
  if (!value) {
    return THEME_CONFIG.defaultTheme;
  }

  const normalized = LEGACY_THEME_MAP[value] ?? value;
  if (themeKeys.includes(normalized as ThemeKey)) {
    return normalized as ThemeKey;
  }

  return THEME_CONFIG.defaultTheme;
};

export const applyTheme = (theme: ThemeKey) => {
  if (typeof document === 'undefined') {
    return;
  }

  const selectedTheme = THEME_CONFIG.themes[theme];
  Object.entries(selectedTheme.vars).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });
};
