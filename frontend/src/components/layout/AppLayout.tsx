import { useEffect } from 'react';
import { clsx } from 'clsx';
import { useChatStore } from '@/store/chatStore';
import { Sidebar } from './Sidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { EmptyState } from '@/components/chat/EmptyState';

export function AppLayout() {
  const { theme, sidebarOpen, activeChatId } = useChatStore();

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      if (theme === 'dark' || (theme === 'system' && mq.matches)) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-50 dark:bg-dark-50">
      <aside
        className={clsx(
          'flex-shrink-0 border-r border-surface-200 transition-all duration-300 ease-in-out dark:border-dark-300',
          'hidden md:flex md:flex-col',
          sidebarOpen ? 'md:w-[320px]' : 'md:w-0 md:overflow-hidden md:border-0',
          activeChatId ? '' : 'flex w-full flex-col',
        )}
      >
        <Sidebar />
      </aside>

      <main
        className={clsx(
          'flex min-w-0 flex-1 flex-col transition-all duration-300',
          !activeChatId ? 'hidden md:flex' : 'flex',
        )}
      >
        {activeChatId ? <ChatPanel /> : <EmptyState />}
      </main>
    </div>
  );
}
