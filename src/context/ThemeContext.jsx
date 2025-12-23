import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        if (theme === 'light') {
            // Premium Light Mode - Warm & Clean
            document.documentElement.style.setProperty('--color-bg', '#fafafa');
            document.documentElement.style.setProperty('--color-surface', '#ffffff');
            document.documentElement.style.setProperty('--color-surface-hover', '#f3f4f6');
            document.documentElement.style.setProperty('--color-surface-active', '#e5e7eb');
            document.documentElement.style.setProperty('--color-border', '#e5e7eb');
            document.documentElement.style.setProperty('--color-text-primary', '#111827');
            document.documentElement.style.setProperty('--color-text-secondary', '#4b5563');
            document.documentElement.style.setProperty('--color-text-muted', '#9ca3af');
            document.documentElement.style.setProperty('--color-primary', '#0d9488');
            document.documentElement.style.setProperty('--color-primary-dark', '#0f766e');
            // Card shadows for depth
            document.documentElement.style.setProperty('--shadow-card', '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)');
            document.body.style.backgroundColor = '#fafafa';
            document.body.style.color = '#111827';
        } else {
            // Dark Mode
            document.documentElement.style.setProperty('--color-bg', '#121212');
            document.documentElement.style.setProperty('--color-surface', '#1e1e1e');
            document.documentElement.style.setProperty('--color-surface-hover', '#282828');
            document.documentElement.style.setProperty('--color-surface-active', '#333333');
            document.documentElement.style.setProperty('--color-border', '#333333');
            document.documentElement.style.setProperty('--color-text-primary', '#ffffff');
            document.documentElement.style.setProperty('--color-text-secondary', '#b3b3b3');
            document.documentElement.style.setProperty('--color-text-muted', '#666666');
            document.documentElement.style.setProperty('--color-primary', '#14b8a6');
            document.documentElement.style.setProperty('--color-primary-dark', '#0d9488');
            document.documentElement.style.setProperty('--shadow-card', 'none');
            document.body.style.backgroundColor = '#121212';
            document.body.style.color = '#ffffff';
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
