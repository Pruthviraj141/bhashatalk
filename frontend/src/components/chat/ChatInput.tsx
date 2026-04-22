import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { Send, Mic, Smile, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';

interface Props {
  chatId: string;
}

export function ChatInput({ chatId }: Props) {
  const [text, setText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser, preferredLanguage } = useChatStore();
  const { sendMessage, isConnected } = useChat(currentUser?.id ?? '');

  const canSend = text.trim().length > 0 && isConnected;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = useCallback(() => {
    if (!canSend || !currentUser) return;
    sendMessage(chatId, text.trim(), preferredLanguage);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }, [canSend, chatId, currentUser, preferredLanguage, sendMessage, text]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 flex-shrink-0 border-t border-surface-200 bg-white px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] dark:border-dark-300 dark:bg-dark-100">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="btn-ghost mb-1 h-11 w-11 flex-shrink-0 text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <div className="flex min-h-[44px] flex-1 items-end rounded-2xl bg-surface-100 px-3.5 py-2.5 dark:bg-dark-200">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Message…"
            rows={1}
            disabled={!isConnected}
            className={clsx(
              'max-h-40 flex-1 resize-none bg-transparent text-sm leading-relaxed text-surface-900 outline-none',
              'placeholder:text-surface-400 dark:text-surface-100 dark:placeholder:text-surface-600',
              'disabled:cursor-not-allowed',
            )}
            style={{ fontFamily: 'inherit' }}
          />
          <button type="button" className="btn-ghost mb-0.5 ml-1 h-11 w-11 flex-shrink-0 text-surface-400" aria-label="Emoji picker">
            <Smile size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {canSend ? (
            <motion.button
              type="button"
              key="send"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              onClick={handleSend}
              className="h-11 w-11 flex-shrink-0 rounded-full bg-primary-600 text-white shadow-message-out transition-colors hover:bg-primary-700 active:bg-primary-800"
              aria-label="Send message"
            >
              <span className="grid place-items-center">
                <Send size={18} />
              </span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              key="mic"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className="h-11 w-11 flex-shrink-0 rounded-full bg-surface-200 text-surface-500 dark:bg-dark-300 dark:text-surface-400"
              aria-label="Voice message"
            >
              <span className="grid place-items-center">
                <Mic size={18} />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {!isConnected && (
        <p className="mt-1.5 text-center text-[11px] text-amber-500 dark:text-amber-400">Reconnecting…</p>
      )}
    </div>
  );
}
