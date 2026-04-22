import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { SearchInput } from '@/components/ui/SearchInput';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ConnectionBadge } from '@/components/ui/ConnectionBadge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Sidebar() {
  const { chats, searchQuery, setSearchQuery, currentUser } = useChatStore();

  const filteredChats = useMemo(() => {
    const list = Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.lastMessage?.content.toLowerCase().includes(q) ||
        c.participants.some((p) => p.toLowerCase().includes(q)),
    );
  }, [chats, searchQuery]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-dark-300">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600">
            <MessageSquare size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-surface-900 dark:text-surface-100">BhashaTalk</span>
        </div>
        <div className="flex items-center gap-1">
          <ConnectionBadge />
          <ThemeToggle />
        </div>
      </div>

      {currentUser && (
        <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-dark-300/50">
          <div className="min-w-0">
            <span className="truncate text-sm font-medium text-surface-700 dark:text-surface-300">
              {currentUser.displayName}
            </span>
          </div>
          <LanguageSelector />
        </div>
      )}

      <div className="px-3 py-2">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search conversations…"
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filteredChats.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-sm text-surface-400 dark:text-surface-600">
            <MessageSquare size={24} className="mb-2 opacity-40" />
            {searchQuery ? 'No results found' : 'No conversations yet'}
          </div>
        ) : (
          filteredChats.map((chat) => <ChatListItem key={chat.id} chat={chat} />)
        )}
      </div>
    </div>
  );
}
