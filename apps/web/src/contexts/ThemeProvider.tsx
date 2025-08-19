'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  systemPrefersDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get the resolved theme (actual light/dark being applied)
  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    // Apply new theme
    if (newTheme === 'dark' || (newTheme === 'system' && systemPrefersDark)) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
      
      // Update CSS custom properties for dark mode
      document.documentElement.style.setProperty('--background', '#0a0a0a');
      document.documentElement.style.setProperty('--foreground', '#ededed');
      document.documentElement.style.setProperty('--card', '#1a1a1a');
      document.documentElement.style.setProperty('--card-foreground', '#ededed');
      document.documentElement.style.setProperty('--popover', '#1a1a1a');
      document.documentElement.style.setProperty('--popover-foreground', '#ededed');
      document.documentElement.style.setProperty('--primary', '#00d4aa');
      document.documentElement.style.setProperty('--primary-foreground', '#000000');
      document.documentElement.style.setProperty('--secondary', '#262626');
      document.documentElement.style.setProperty('--secondary-foreground', '#d4d4d4');
      document.documentElement.style.setProperty('--muted', '#262626');
      document.documentElement.style.setProperty('--muted-foreground', '#a3a3a3');
      document.documentElement.style.setProperty('--accent', '#262626');
      document.documentElement.style.setProperty('--accent-foreground', '#d4d4d4');
      document.documentElement.style.setProperty('--destructive', '#7f1d1d');
      document.documentElement.style.setProperty('--destructive-foreground', '#ffffff');
      document.documentElement.style.setProperty('--border', '#262626');
      document.documentElement.style.setProperty('--input', '#1a1a1a');
      document.documentElement.style.setProperty('--ring', '#00d4aa');
    } else {
      root.classList.add('light');
      body.classList.add('light');
      root.style.colorScheme = 'light';
      
      // Update CSS custom properties for light mode
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--foreground', '#171717');
      document.documentElement.style.setProperty('--card', '#ffffff');
      document.documentElement.style.setProperty('--card-foreground', '#171717');
      document.documentElement.style.setProperty('--popover', '#ffffff');
      document.documentElement.style.setProperty('--popover-foreground', '#171717');
      document.documentElement.style.setProperty('--primary', '#006B53');
      document.documentElement.style.setProperty('--primary-foreground', '#ffffff');
      document.documentElement.style.setProperty('--secondary', '#f3f4f6');
      document.documentElement.style.setProperty('--secondary-foreground', '#374151');
      document.documentElement.style.setProperty('--muted', '#f9fafb');
      document.documentElement.style.setProperty('--muted-foreground', '#6b7280');
      document.documentElement.style.setProperty('--accent', '#f3f4f6');
      document.documentElement.style.setProperty('--accent-foreground', '#374151');
      document.documentElement.style.setProperty('--destructive', '#ef4444');
      document.documentElement.style.setProperty('--destructive-foreground', '#ffffff');
      document.documentElement.style.setProperty('--border', '#e5e7eb');
      document.documentElement.style.setProperty('--input', '#ffffff');
      document.documentElement.style.setProperty('--ring', '#006B53');
    }
  }, [systemPrefersDark]);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      console.log('Theme saved to localStorage:', newTheme);
    }
    
    // Apply the theme
    applyTheme(newTheme);
  }, [applyTheme]);

  // Initialize theme system
  useEffect(() => {
    setMounted(true);
    
    // Set up system preference listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
      console.log('System preference changed to:', e.matches ? 'dark' : 'light');
      
      // If current theme is system, apply the new system preference
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    // Set initial system preference
    setSystemPrefersDark(mediaQuery.matches);
    
    // Listen for system preference changes
    mediaQuery.addEventListener('change', handleSystemChange);
    
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'system';
    
    console.log('Initializing theme system:', { savedTheme, initialTheme, systemPrefersDark: mediaQuery.matches });
    
    setThemeState(initialTheme);
    applyTheme(initialTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, [applyTheme, theme]);

  // Apply theme when system preference changes
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [mounted, theme, systemPrefersDark, applyTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    systemPrefersDark,
  };

  return (
    <ThemeContext.Provider value={value}>
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
