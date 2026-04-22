import { Moon, Sun } from 'lucide-react'
import type { Conversation } from '../types/chat'
import { StatusChip } from './ui/StatusChip'

interface ChatHeaderProps {
  conversation?: Conversation
  connected: boolean
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function ChatHeader({ conversation, connected, darkMode, onToggleDarkMode }: ChatHeaderProps) {
  const username = conversation?.username ?? 'Select a chat'
  const languageMap: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
  }
  const receiverLangCode = conversation?.receiverLang?.toLowerCase() ?? ''
  const receiverLang = receiverLangCode ? (languageMap[receiverLangCode] ?? receiverLangCode.toUpperCase()) : ''
  const profileTitle = receiverLang ? `${username} (${receiverLang})` : username
  const avatarLetter = username.slice(0, 1).toUpperCase()
  const avatarColor = conversation?.avatarColor ?? '#64748b'
  const statusTone = connected ? (conversation?.online ? 'online' : 'delivered') : 'reconnecting'
  const statusLabel = connected ? (conversation?.online ? 'Online' : 'Connected') : 'Reconnecting'

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-5 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white shadow-chat"
            style={{ backgroundColor: avatarColor }}
          >
            {avatarLetter}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">{profileTitle}</p>
          <div className="mt-1">
            <StatusChip tone={statusTone} label={statusLabel} compact />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-700 hover:shadow-sm dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  )
}
