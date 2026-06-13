import { createContext, use, useMemo, useState, type ReactNode } from 'react';
import { defaultThemeId, themes, type AppTheme, type ThemeId } from './themes';

type ThemeContextValue = {
  theme: AppTheme;
  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
  themeOptions: Array<{ id: ThemeId; label: string }>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(defaultThemeId);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeId],
      themeId,
      setThemeId,
      themeOptions: Object.values(themes).map(themeOption => ({
        id: themeOption.id,
        label: themeOption.label,
      })),
    }),
    [themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}

export { ThemeProvider, useTheme };
