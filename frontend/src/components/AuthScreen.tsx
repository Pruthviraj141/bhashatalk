import { useMemo, useState, type FormEvent } from 'react'
import { Eye, EyeOff, Globe2, Languages, MessageSquareQuote, ShieldCheck } from 'lucide-react'

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
] as const

interface AuthScreenProps {
  loading: boolean
  error: string | null
  onLogin: (payload: { username: string; password: string }) => Promise<void>
  onRegister: (payload: { username: string; password: string; preferred_language: string }) => Promise<void>
}

export function AuthScreen({ loading, error, onLogin, onRegister }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [showPassword, setShowPassword] = useState(false)

  const canSubmit = useMemo(() => {
    if (username.trim().length < 3 || password.length < 6) return false
    if (mode === 'register' && !SUPPORTED_LANGUAGES.some((item) => item.code === preferredLanguage)) return false
    return true
  }, [mode, password, preferredLanguage, username])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit || loading) return

    if (mode === 'login') {
      await onLogin({ username: username.trim(), password })
      return
    }

    await onRegister({
      username: username.trim(),
      password,
      preferred_language: preferredLanguage.trim(),
    })
  }

  return (
    <main className="grid min-h-[100svh] place-items-center p-5 md:p-8">
      <section className="app-shell grid w-full max-w-6xl overflow-hidden rounded-3xl md:grid-cols-[1.15fr_0.85fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/50 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-10 text-white dark:border-slate-800/80 md:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.24),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.24),transparent_42%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              <Globe2 size={14} />
              Real-time multilingual messaging
            </p>
            <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight">
              Chat naturally in your language.
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/85">
              Send once, read everywhere. Fast translation, reliable delivery, and a focused workspace for everyday conversation.
            </p>
          </div>

          <div className="relative space-y-3">
            {[
              { icon: <Languages size={16} />, title: 'Instant translation', text: 'English, Hindi, Marathi in one stream.' },
              { icon: <MessageSquareQuote size={16} />, title: 'Desktop productivity flow', text: 'Inbox-first layout built for speed.' },
              { icon: <ShieldCheck size={16} />, title: 'Reliable real-time sync', text: 'Low-latency updates with delivery feedback.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {item.icon}
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-white/85">{item.text}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative p-5 md:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Welcome</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {mode === 'login'
                ? 'Access your multilingual workspace and recent conversations.'
                : 'Set up your profile and preferred language in seconds.'}
            </p>

            <form className="mt-7 space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Username
                </span>
                <div className="field-shell">
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="e.g. rahul"
                    autoComplete="username"
                  />
                </div>
                <p className="mt-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">Minimum 3 characters</p>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Password
                </span>
                <div className="field-shell flex items-center gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border-0 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="Minimum 6 characters"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">Use at least 6 characters</p>
              </label>

              {mode === 'register' && (
                <fieldset>
                  <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Preferred language
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {SUPPORTED_LANGUAGES.map((language) => {
                      const checked = preferredLanguage === language.code
                      return (
                        <label
                          key={language.code}
                          className={[
                            'flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all',
                            checked
                              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm dark:border-primary-500/70 dark:bg-primary-500/10 dark:text-primary-300'
                              : 'border-slate-200 bg-white/80 text-slate-700 hover:border-primary-300 hover:bg-primary-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-primary-700/70 dark:hover:bg-primary-500/10',
                          ].join(' ')}
                        >
                          <input
                            type="radio"
                            name="preferred-language"
                            checked={checked}
                            onChange={() => setPreferredLanguage(language.code)}
                            className="sr-only"
                          />
                          {language.label}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )}

              {error && (
                <p className="rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </p>
              )}

              <button type="submit" disabled={!canSubmit || loading} className="btn-primary w-full py-2.5 text-sm">
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-primary-700 transition hover:border-primary-200 hover:bg-primary-50 dark:text-primary-300 dark:hover:border-primary-700/50 dark:hover:bg-primary-500/10"
              onClick={() => {
                setMode((m) => (m === 'login' ? 'register' : 'login'))
                setPassword('')
                setShowPassword(false)
              }}
            >
              {mode === 'login' ? 'New here? Create account' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
