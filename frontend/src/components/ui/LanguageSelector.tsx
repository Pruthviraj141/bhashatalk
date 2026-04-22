import { useChatStore, type Language } from '@/store/chatStore';

const LANG_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'HI' },
  { value: 'mr', label: 'MR' },
];

export function LanguageSelector() {
  const { preferredLanguage, setPreferredLanguage } = useChatStore();

  return (
    <select
      value={preferredLanguage}
      onChange={(event) => setPreferredLanguage(event.target.value as Language)}
      className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs font-medium text-surface-700 outline-none focus:border-primary-500 dark:border-dark-300 dark:bg-dark-200 dark:text-surface-100"
      aria-label="Preferred language"
    >
      {LANG_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
