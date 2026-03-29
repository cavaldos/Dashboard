
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FONT_FAMILY_CONFIG,
  FONT_FAMILY_STORAGE_KEY,
  applyFontFamily,
  fontFamilyKeys,
  normalizeFontFamily,
  type FontFamilyKey,
} from '~/config/font-family-config';
import { FONT_SIZE_CONFIG, FONT_SIZE_STORAGE_KEY, applyFontSize, fontSizeKeys, normalizeFontSize, type FontSizeKey } from '~/config/font-size-config';
import { THEME_CONFIG, THEME_STORAGE_KEY, applyTheme, normalizeTheme, themeKeys, type ThemeKey } from '~/config/theme-config';
import { UiSelect } from '~/components/UI/UiSelect';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Intro', to: '/intro' },
  { label: 'Crypto', to: '/crypto' },
  { label: 'Forex', to: '/forex' },
  { label: 'Memecoin', to: '/memecoin' },
  { label: 'NewsTrade', to: '/newstrade' },
];

const Header: React.FC<{ isCondensed: boolean }> = ({ isCondensed }) => {
  const isElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState<ThemeKey>(() => {
    if (typeof window === 'undefined') {
      return THEME_CONFIG.defaultTheme;
    }

    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  });
  const [activeFontSize, setActiveFontSize] = useState<FontSizeKey>(() => {
    if (typeof window === 'undefined') {
      return FONT_SIZE_CONFIG.defaultSize;
    }

    return normalizeFontSize(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY));
  });
  const [activeFontFamily, setActiveFontFamily] = useState<FontFamilyKey>(() => {
    if (typeof window === 'undefined') {
      return FONT_FAMILY_CONFIG.defaultFamily;
    }

    return normalizeFontFamily(window.localStorage.getItem(FONT_FAMILY_STORAGE_KEY));
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyTheme(activeTheme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    }
  }, [activeTheme]);

  useEffect(() => {
    applyFontSize(activeFontSize);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, activeFontSize);
    }
  }, [activeFontSize]);

  useEffect(() => {
    applyFontFamily(activeFontFamily);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FONT_FAMILY_STORAGE_KEY, activeFontFamily);
    }
  }, [activeFontFamily]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!settingsRef.current || !isSettingsOpen) {
        return;
      }

      if (!settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (!isElectron) {
      return;
    }

    window.electronAPI.windowControl(action);
  };

  const activeNavValue =
    NAV_ITEMS.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))?.to ?? '/';

  return (
    <header className={`app-header${isCondensed ? ' is-condensed' : ''}`}>
      <div className="app-header-inner">
        {isElectron ? (
          <div className="app-window-controls" aria-label="Window controls">
            <button
              type="button"
              className="app-window-control is-close"
              onClick={() => handleWindowControl('close')}
              aria-label="Close window"
            >
              x
            </button>
            <button
              type="button"
              className="app-window-control is-minimize"
              onClick={() => handleWindowControl('minimize')}
              aria-label="Minimize window"
            >
              -
            </button>
            <button
              type="button"
              className="app-window-control is-maximize"
              onClick={() => handleWindowControl('maximize')}
              aria-label="Maximize window"
            >
              ÷
            </button>
          </div>
        ) : null}

        <NavLink to="/" className="app-brand">
          DashBoard
        </NavLink>

        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-nav-compact" aria-label="Main navigation compact">
          <UiSelect
            value={activeNavValue}
            ariaLabel="Main navigation compact"
            onChange={(value) => navigate(value)}
            options={NAV_ITEMS.map((item) => ({ value: item.to, label: item.label }))}
          />
        </div>

        <a
          className="app-github-link"
          href="https://github.com/cavaldos/Dictation"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>

        <div className="app-settings" ref={settingsRef}>
          <button
            type="button"
            className={`app-settings-btn${isSettingsOpen ? ' is-active' : ''}`}
            onClick={() => setIsSettingsOpen((open) => !open)}
            aria-expanded={isSettingsOpen}
            aria-haspopup="true"
          >
            Settings
          </button>

          <div className={`app-settings-panel${isSettingsOpen ? ' is-open' : ''}`}>
            <div className="app-setting-row">
              <span className="app-setting-label">Theme</span>
              <UiSelect
                value={activeTheme}
                ariaLabel="Theme setting"
                onChange={(value) => setActiveTheme(value as ThemeKey)}
                options={themeKeys.map((themeKey) => ({ value: themeKey, label: THEME_CONFIG.themes[themeKey].label }))}
              />
            </div>

            <div className="app-font-size-group" role="group" aria-label="Font size setting">
              {fontSizeKeys.map((sizeKey) => (
                <button
                  key={sizeKey}
                  type="button"
                  className={`app-font-btn${activeFontSize === sizeKey ? ' is-active' : ''}`}
                  onClick={() => setActiveFontSize(sizeKey)}
                >
                  {FONT_SIZE_CONFIG.sizes[sizeKey].label}
                </button>
              ))}
            </div>

            <div className="app-setting-row">
              <span className="app-setting-label">Font</span>
              <UiSelect
                value={activeFontFamily}
                ariaLabel="Font family setting"
                onChange={(value) => setActiveFontFamily(value as FontFamilyKey)}
                options={fontFamilyKeys.map((fontFamilyKey) => ({
                  value: fontFamilyKey,
                  label: FONT_FAMILY_CONFIG.families[fontFamilyKey].label,
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isHeaderCondensed, setIsHeaderCondensed] = useState(false);

  useEffect(() => {
    const contentNode = contentRef.current;

    if (!contentNode) {
      return;
    }

    const applyHeaderState = (scrollTop: number) => {
      const shouldCondense = scrollTop > 18;

      setIsHeaderCondensed((previousValue) => {
        if (previousValue === shouldCondense) {
          return previousValue;
        }

        return shouldCondense;
      });
    };

    const syncHeaderCondensedState = (event?: Event) => {
      const eventTarget = event?.target;

      if (eventTarget === contentNode) {
        applyHeaderState(contentNode.scrollTop);
        return;
      }

      if (eventTarget instanceof HTMLElement && eventTarget.classList.contains('intro-content')) {
        applyHeaderState(eventTarget.scrollTop);
      }
    };

    const introContentNode = contentNode.querySelector<HTMLElement>('.intro-content');

    if (introContentNode) {
      applyHeaderState(introContentNode.scrollTop);
    } else {
      applyHeaderState(contentNode.scrollTop);
    }

    contentNode.addEventListener('scroll', syncHeaderCondensedState, { passive: true, capture: true });

    return () => {
      contentNode.removeEventListener('scroll', syncHeaderCondensedState, true);
    };
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Header isCondensed={isHeaderCondensed} />
      <div className="app-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
