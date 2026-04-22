import { Loader2, Mic, Paperclip, SendHorizontal, Smile, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface MessageInputProps {
  onSend: (text: string) => void
  onTyping?: (typing: boolean) => void
  disabled?: boolean
  sending?: boolean
}

export function MessageInput({ onSend, onTyping, disabled = false, sending = false }: MessageInputProps) {
  const [text, setText] = useState('')
  const [speechLang, setSpeechLang] = useState<string>(() => localStorage.getItem('chat-speech-lang') ?? 'en-US')
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)

  type BrowserSpeechRecognition = {
    lang: string
    interimResults: boolean
    continuous: boolean
    start: () => void
    stop: () => void
    onstart: (() => void) | null
    onend: (() => void) | null
    onerror: ((event: { error?: string }) => void) | null
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null
  }

  type BrowserSpeechConstructor = new () => BrowserSpeechRecognition

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)

  const speechSupported = useMemo(() => {
    const win = window as Window & {
      SpeechRecognition?: BrowserSpeechConstructor
      webkitSpeechRecognition?: BrowserSpeechConstructor
    }
    return Boolean(win.SpeechRecognition ?? win.webkitSpeechRecognition)
  }, [])

  const languageOptions = useMemo(
    () => [
      { value: 'en-US', label: 'English' },
      { value: 'hi-IN', label: 'Hindi' },
      { value: 'mr-IN', label: 'Marathi' },
    ],
    [],
  )

  useEffect(() => {
    const win = window as Window & {
      SpeechRecognition?: BrowserSpeechConstructor
      webkitSpeechRecognition?: BrowserSpeechConstructor
    }
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition

    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = speechLang
    recognition.interimResults = false
    recognition.continuous = true

    recognition.onstart = () => {
      setIsListening(true)
      setSpeechError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone permission denied')
      } else if (event.error === 'no-speech') {
        setSpeechError('No speech detected')
      } else {
        setSpeechError('Voice input error')
      }
    }

    recognition.onresult = (event) => {
      const parts: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i]?.[0]?.transcript?.trim()
        if (chunk) parts.push(chunk)
      }
      if (!parts.length) return
      setText((prev) => [prev.trim(), parts.join(' ')].filter(Boolean).join(' ').trim())
      onTyping?.(true)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [onTyping, speechLang])

  useEffect(() => {
    localStorage.setItem('chat-speech-lang', speechLang)
  }, [speechLang])

  const submit = () => {
    const value = text.trim()
    if (!value || disabled || sending) return
    onSend(value)
    onTyping?.(false)
    setText('')
  }

  const toggleListening = () => {
    const recognition = recognitionRef.current
    if (!recognition || disabled) return

    setSpeechError(null)
    if (isListening) {
      recognition.stop()
      return
    }
    recognition.lang = speechLang
    recognition.start()
  }

  return (
    <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/85 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85 md:px-6">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-3xl border border-slate-200 bg-white/85 px-2.5 py-2.5 shadow-panel dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
        <button
          type="button"
          disabled={disabled}
          className="btn-ghost grid h-10 w-10 place-items-center rounded-xl border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Attach file"
          title="Attachment (coming soon)"
        >
          <Paperclip size={18} />
        </button>

        <button
          type="button"
          disabled={disabled}
          className="btn-ghost grid h-10 w-10 place-items-center rounded-xl border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          aria-label="Insert emoji"
          title="Emoji picker (coming soon)"
        >
          <Smile size={18} />
        </button>

        <select
          value={speechLang}
          onChange={(event) => setSpeechLang(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-primary-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-primary-500"
          aria-label="Speech language"
          disabled={disabled}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled || !speechSupported}
          className="grid h-10 w-10 place-items-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          title={speechSupported ? 'Voice input' : 'Voice input not supported in this browser'}
        >
          {isListening ? <Square size={16} className="text-red-500" /> : <Mic size={18} />}
        </button>

        <div className="field-shell min-h-[44px] flex-1 rounded-2xl px-3 py-2">
          <input
            value={text}
            onChange={(event) => {
              const value = event.target.value
              setText(value)
              onTyping?.(value.trim().length > 0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
            placeholder={isListening ? 'Listening… speak now' : 'Type a message'}
            className="w-full border-0 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim() || sending}
          className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-chat transition-all duration-200 hover:-translate-y-0.5 hover:from-primary-500 hover:to-primary-600 hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-55"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={17} className="animate-spin" /> : <SendHorizontal size={17} />}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between px-2 text-xs">
        <div className="text-slate-500 dark:text-slate-400">{speechError ?? (!speechSupported ? 'Voice input is not supported in this browser.' : '')}</div>
        {sending && <div className="font-medium text-primary-700 dark:text-primary-300">Sending…</div>}
      </div>
    </div>
  )
}
