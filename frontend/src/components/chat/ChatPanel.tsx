import { ArrowLeft, Circle } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const { activeChatId, chats, setActiveChat } = useChatStore();

  if (!activeChatId) {
    return null;
  }

  const activeChat = chats[activeChatId];
  const title = activeChat?.participants.join(', ') || 'Conversation';

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-surface-50 dark:bg-dark-50">
      <header className="flex h-16 items-center gap-2 border-b border-surface-200 px-4 dark:border-dark-300">
        <button onClick={() => setActiveChat(null)} className="btn-ghost -ml-1 mr-1 h-11 w-11 md:hidden" aria-label="Back to chats">
          <ArrowLeft size={20} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary-200" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-100">{title}</p>
            <p className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
              <Circle size={8} className="fill-primary-500 text-primary-500" /> Online
            </p>
          </div>
        </div>
      </header>

      <MessageList chatId={activeChatId} />
      <ChatInput chatId={activeChatId} />
    </section>
  );
}
