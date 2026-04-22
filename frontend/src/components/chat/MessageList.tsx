import { useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from './MessageBubble';

export function MessageList({ chatId }: { chatId: string }) {
  const messages = useChatStore((s) => s.messages[chatId] ?? []);
  const currentUser = useChatStore((s) => s.currentUser);
  const ref = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (messages.length > 0) {
      ref.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <Virtuoso
      ref={ref}
      data={messages}
      followOutput="smooth"
      alignToBottom
      style={{ flex: 1 }}
      itemContent={(index, message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUser?.id}
          showAvatar={index === 0 || messages[index - 1]?.senderId !== message.senderId}
        />
      )}
    />
  );
}
