import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Clock, Languages, Smile } from 'lucide-react';
import DOMPurify from 'dompurify';
import { clsx } from 'clsx';
import { useChatStore, type Message } from '@/store/chatStore';

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar }: Props) {
  const { preferredLanguage } = useChatStore();
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const pressTimerRef = useRef<number | null>(null);

  const translated = message.translatedContent?.[preferredLanguage];
  const hasTranslation =
    Boolean(translated) && translated !== message.content && message.language !== preferredLanguage;

  const sanitizedContent = DOMPurify.sanitize(message.content, { ALLOWED_TAGS: [] });

  const onTouchStart = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = window.setTimeout(() => setShowReactions(true), 450);
  };

  const onTouchEnd = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={clsx(
        'group mb-1 flex gap-2 px-4',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        message.isOptimistic && 'opacity-70',
      )}
    >
      {!isOwn && showAvatar && (
        <div className="mb-1 h-7 w-7 flex-shrink-0 self-end rounded-full bg-primary-200 dark:bg-primary-900" />
      )}
      {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div className={clsx('flex max-w-[80%] flex-col md:max-w-[70%] lg:max-w-[60%]', isOwn && 'items-end')}>
        <div
          className={clsx(
            'relative px-3.5 py-2 text-sm leading-relaxed animate-message-in-anim',
            isOwn
              ? 'chat-bubble-out'
              : 'chat-bubble-in border border-surface-100 dark:border-dark-300',
          )}
          onMouseEnter={() => setShowTime(true)}
          onMouseLeave={() => setShowTime(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <p className="whitespace-pre-wrap break-words">{sanitizedContent}</p>

          {hasTranslation && (
            <button
              type="button"
              onClick={() => setShowTranslation((s) => !s)}
              className={clsx(
                'mt-1.5 flex items-center gap-1 text-[11px] font-medium transition-colors',
                isOwn
                  ? 'text-primary-200 hover:text-white'
                  : 'text-primary-500 hover:text-primary-700 dark:text-primary-400',
              )}
            >
              <Languages size={11} />
              {showTranslation ? 'Hide translation' : `View in ${preferredLanguage.toUpperCase()}`}
            </button>
          )}

          <AnimatePresence>
            {showTranslation && translated && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  'mt-1.5 border-t pt-1.5 text-[12px] italic',
                  isOwn
                    ? 'border-primary-400/50 text-primary-100'
                    : 'border-surface-200 text-surface-500 dark:border-dark-300 dark:text-surface-400',
                )}
              >
                <span className="mr-1 rounded bg-surface-200 px-1 py-0.5 text-[10px] not-italic dark:bg-dark-300">
                  translated
                </span>
                {translated}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={clsx('mt-0.5 flex items-center gap-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
            <span
              className={clsx(
                'text-[10px] transition-all duration-150',
                isOwn ? 'text-primary-200' : 'text-surface-400 dark:text-surface-500',
                !showTime && 'md:opacity-0 md:group-hover:opacity-100',
              )}
            >
              {formatDistanceToNow(message.timestamp, { addSuffix: false })}
            </span>
            {isOwn && <MessageStatusIcon status={message.status} />}
          </div>

          {showReactions && (
            <div className="absolute -top-8 left-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-chat dark:bg-dark-200">
              <button type="button" className="btn-ghost p-1 text-xs" onClick={() => setShowReactions(false)}>
                👍
              </button>
              <button type="button" className="btn-ghost p-1 text-xs" onClick={() => setShowReactions(false)}>
                ❤️
              </button>
              <button type="button" className="btn-ghost p-1 text-xs" onClick={() => setShowReactions(false)}>
                <Smile size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MessageStatusIcon({ status }: { status: Message['status'] }) {
  const cls = 'text-primary-200';
  if (status === 'sending') return <Clock size={11} className={cls} />;
  if (status === 'sent') return <Check size={11} className={cls} />;
  if (status === 'delivered') return <CheckCheck size={11} className={cls} />;
  if (status === 'read') return <CheckCheck size={11} className="text-accent-300" />;
  return null;
}
