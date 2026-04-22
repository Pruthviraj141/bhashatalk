import { Moon, Sun } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useChatStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-ghost text-surface-500 dark:text-surface-300"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
