interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-800 outline-none transition-colors focus:border-primary-500 dark:border-dark-300 dark:bg-dark-200 dark:text-surface-100"
    />
  );
}
