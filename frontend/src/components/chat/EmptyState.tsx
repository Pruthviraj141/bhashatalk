import { MessageSquare } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="grid h-full place-items-center bg-surface-50 p-6 dark:bg-dark-50">
      <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
          <MessageSquare size={22} />
        </div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Welcome to BhashaTalk</h2>
        <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
          Select a conversation from the left panel to start chatting.
        </p>
      </div>
    </div>
  );
}
