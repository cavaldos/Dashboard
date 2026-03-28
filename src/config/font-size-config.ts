export type FontSizeKey = 'small' | 'medium' | 'large';

type FontSizeDefinition = {
  label: string;
  offset: string;
};

type FontSizeConfig = {
  defaultSize: FontSizeKey;
  sizes: Record<FontSizeKey, FontSizeDefinition>;
};

export const FONT_SIZE_STORAGE_KEY = 'ui-font-size';

export const FONT_SIZE_CONFIG: FontSizeConfig = {
  defaultSize: 'medium',
  sizes: {
    small: {
      label: 'Small',
      offset: '-2px',
    },
    medium: {
      label: 'Medium',
      offset: '0px',
    },
    large: {
      label: 'Large',
      offset: '2px',
    },
  },
};

export const fontSizeKeys = Object.keys(FONT_SIZE_CONFIG.sizes) as FontSizeKey[];

export const normalizeFontSize = (value: string | null | undefined): FontSizeKey => {
  if (!value || !fontSizeKeys.includes(value as FontSizeKey)) {
    return FONT_SIZE_CONFIG.defaultSize;
  }

  return value as FontSizeKey;
};

export const applyFontSize = (size: FontSizeKey) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty('--font-size-offset', FONT_SIZE_CONFIG.sizes[size].offset);
};
