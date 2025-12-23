import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ compact = false }) => {
    const { theme, toggleTheme, isDark } = useTheme();

    if (compact) {
        return (
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-colors"
                title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-colors"
        >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>
    );
};

export default ThemeToggle;
