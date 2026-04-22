import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Check, CheckCheck, Clock3 } from 'lucide-react'
import type { ChatMessage } from '../types/chat'
import { formatTime } from '../utils/time'

interface MessageBubbleProps {
  item: ChatMessage
  mine: boolean
}

export function MessageBubble({ item, mine }: MessageBubbleProps) {
  const showOriginal = Boolean(item.originalText && item.originalText.trim() && item.originalText !== item.translatedText)
  const showTranslatedChip = showOriginal

  const statusIcon =
    item.deliveryStatus === 'read' ? (
      <CheckCheck size={12} className="text-blue-500 dark:text-blue-400" />
    ) : item.deliveryStatus === 'delivered' ? (
      <CheckCheck size={12} className="text-brand-600 dark:text-brand-300" />
    ) : item.deliveryStatus === 'sent' ? (
      <Check size={12} className="text-chat-textMuted dark:text-slate-400" />
    ) : item.deliveryStatus === 'sending' ? (
      <Clock3 size={12} className="text-chat-textMuted dark:text-slate-400" />
    ) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={clsx('mb-2 flex w-full', mine ? 'justify-end' : 'justify-start')}
    >
      <motion.div
        className={clsx(
          'max-w-[82%] rounded-3xl px-4 py-3 shadow-chat md:max-w-[70%] dark:shadow-none',
          mine
            ? 'chat-bubble-out rounded-br-md'
            : 'chat-bubble-in rounded-bl-md',
        )}
      >
        {showTranslatedChip && (
          <span
            className={clsx(
              'mb-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              mine
                ? 'border-white/30 bg-white/10 text-white/90'
                : 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-700/50 dark:bg-primary-500/10 dark:text-primary-300',
            )}
          >
            Translated
          </span>
        )}

        <p className={clsx('text-[15px] font-medium leading-6', mine ? 'text-white' : 'text-slate-900 dark:text-slate-100')}>
          {item.translatedText}
        </p>
        {showOriginal && (
          <div
            className={clsx(
              'mt-2 rounded-xl border px-2.5 py-1.5',
              mine
                ? 'border-white/20 bg-white/10 text-white/85'
                : 'border-slate-200/80 bg-slate-100/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Original</p>
            <p className="mt-0.5 text-xs leading-5">{item.originalText}</p>
          </div>
        )}
        <div className={clsx('mt-2 flex items-center justify-end gap-1.5 text-[11px]', mine ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>
          {mine && item.deliveryStatus === 'sending' && <span className="font-medium">Sending...</span>}
          <span>{formatTime(item.timestamp)}</span>
          {mine && statusIcon}
        </div>
      </motion.div>
    </motion.div>
  )
}
