import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore, type Chat } from '@/store/chatStore';

interface ChatListItemProps {
  chat: Chat;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const { activeChatId, setActiveChat } = useChatStore();
  const isActive = activeChatId === chat.id;

  return (
    <button
      type="button"
      onClick={() => setActiveChat(chat.id)}
      className={clsx(
        'w-full border-l-2 border-transparent px-4 py-3 text-left transition-colors',
        'hover:bg-surface-100 dark:hover:bg-dark-200',
        isActive && 'sidebar-item-active',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-surface-800 dark:text-surface-100">
          {chat.participants.join(', ') || 'Conversation'}
        </p>
        {chat.lastMessage && (
          <span className="text-[11px] text-surface-400 dark:text-surface-500">
            {formatDistanceToNow(chat.lastMessage.timestamp, { addSuffix: true })}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-surface-500 dark:text-surface-400">
        {chat.lastMessage?.content ?? 'No messages yet'}
      </p>
    </button>
  );
}
