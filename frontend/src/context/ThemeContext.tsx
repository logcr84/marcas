import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme') as Theme;
    return saved || 'dark'; // Default a oscuro
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      
      const listener = (e: MediaQueryListEvent) => {
        document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      return () => {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
      };
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
