'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Eye, EyeOff, LogOut, Moon, Sun, User as UserIcon, X } from 'lucide-react'

import { ALLOWED_EMAIL_DOMAIN, BIO_MAX, MIN_PASSWORD_LENGTH, NAME_MAX, type AuthResult, type AuthState } from '@/lib/auth'
import { SECTIONS } from '@/lib/routine-data'

const FIELD =
  'w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:border-white/10 dark:focus-visible:ring-[#0A84FF]/60'
const PRIMARY =
  'ios-active w-full rounded-full py-2.5 text-[15px] font-semibold transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60'

// Round profile picture, falling back to the first letter of the name / email.
export function Avatar({
  url,
  name,
  email,
  className = 'size-11 text-[16px]',
}: {
  url?: string | null
  name?: string | null
  email?: string | null
  className?: string
}) {
  const letter = (name?.trim() || email?.trim() || '').charAt(0).toUpperCase()
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#007AFF]/15 font-bold text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]`}
    >
      {letter || <UserIcon className="size-1/2" />}
    </span>
  )
}

type Mode = 'signin' | 'signup' | 'forgot'

export function AccountSheet({
  open,
  onClose,
  auth,
  reason,
  dark,
  onToggleDark,
  section,
  onChooseSection,
}: {
  open: boolean
  onClose: () => void
  auth: AuthState
  reason?: string
  dark: boolean
  onToggleDark: () => void
  section: string
  onChooseSection: (section: string) => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const heading = auth.recovery ? 'New password' : auth.user ? 'Your profile' : 'Account'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="animate-backdrop absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="animate-sheet panel relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-[22px] font-bold tracking-tight">{heading}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-slate-500 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          {!auth.configured ? (
            <p className="py-4 text-[14px] text-slate-500 dark:text-slate-400">
              Accounts are not set up on this deployment yet. The class routine still works as usual.
            </p>
          ) : auth.loading ? (
            <p className="py-4 text-[14px] text-slate-500 dark:text-slate-400">Loading…</p>
          ) : auth.recovery && auth.user ? (
            <NewPasswordForm auth={auth} onDone={onClose} />
          ) : auth.user ? (
            <ProfileView auth={auth} onClose={onClose} dark={dark} onToggleDark={onToggleDark} section={section} onChooseSection={onChooseSection} />
          ) : (
            <SignedOutView auth={auth} reason={reason} section={section} onChooseSection={onChooseSection} />
          )}
        </div>
      </div>
    </div>
  )
}

function Notice({ result }: { result: AuthResult | null }) {
  if (!result) return null
  const message = result.ok ? result.message : result.error
  if (!message) return null
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={`mt-3 rounded-xl px-3 py-2 text-[13px] font-medium ${
        result.ok ? 'bg-[#30D158]/12 text-[#1E9E3F] dark:text-[#30D158]' : 'bg-[#FF3B30]/10 text-[#D70015] dark:text-[#FF453A]'
      }`}
    >
      {message}
    </p>
  )
}

function PasswordField({
  value,
  onChange,
  label = 'Password',
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  label?: string
  autoComplete: 'current-password' | 'new-password'
}) {
  const [show, setShow] = useState(false)
  return (
    <label className="grid gap-1">
      <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="relative block">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          minLength={autoComplete === 'new-password' ? MIN_PASSWORD_LENGTH : undefined}
          className={`${FIELD} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:hover:text-slate-200"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  )
}

function SignedOutView({
  auth,
  reason,
  section,
  onChooseSection,
}: {
  auth: AuthState
  reason?: string
  section: string
  onChooseSection: (section: string) => void
}) {
  const [mode, setMode] = useState<Mode>('signin')
  const [tab, setTab] = useState<'edit' | 'section'>('edit')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AuthResult | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setResult(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setResult(null)
    const res =
      mode === 'signin' ? await auth.signIn(email, password) : mode === 'signup' ? await auth.signUp(email, password) : await auth.sendReset(email)
    setBusy(false)
    setResult(res)
    if (res.ok && mode === 'signup') {
      setPassword('')
      setMode('signin')
    }
  }

  return (
    <div>
      <ProfileTabs tab={tab} onChange={setTab} />
      {tab === 'section' ? (
        <SectionPanel section={section} onChoose={onChooseSection} />
      ) : (
        <>
      {reason && <p className="mb-3 text-[14px] text-slate-500 dark:text-slate-400">{reason}</p>}

      {mode !== 'forgot' && (
        <div className="flex gap-1.5" role="group" aria-label="Sign in or create account">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
              className={`flex-1 rounded-full px-2 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 ${
                mode === m ? 'ios-active' : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
      )}

      {mode === 'forgot' && (
        <p className="text-[14px] text-slate-500 dark:text-slate-400">Enter your university email and we will send you a link to reset your password.</p>
      )}

      <form onSubmit={submit} className="mt-3 grid gap-2.5">
        <label className="grid gap-1">
          <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">University email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            placeholder={`id@${ALLOWED_EMAIL_DOMAIN}`}
            className={FIELD}
          />
        </label>
        {mode !== 'forgot' && (
          <PasswordField
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        )}
        {mode === 'signup' && (
          <p className="-mt-1 text-[12px] text-slate-400 dark:text-slate-500">
            At least {MIN_PASSWORD_LENGTH} characters. Only @{ALLOWED_EMAIL_DOMAIN} addresses can sign up, and we will email you a link to confirm.
          </p>
        )}
        <button type="submit" disabled={busy} className={`${PRIMARY} mt-1`}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>

      <Notice result={result} />

      <div className="mt-4 text-center text-[13px]">
        {mode === 'signin' && (
          <button type="button" onClick={() => switchMode('forgot')} className="font-medium text-[#007AFF] dark:text-[#0A84FF]">
            Forgot password?
          </button>
        )}
        {mode === 'forgot' && (
          <button type="button" onClick={() => switchMode('signin')} className="font-medium text-[#007AFF] dark:text-[#0A84FF]">
            Back to sign in
          </button>
        )}
      </div>
        </>
      )}
    </div>
  )
}

function NewPasswordForm({ auth, onDone }: { auth: AuthState; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AuthResult | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const res = await auth.setNewPassword(password)
    setBusy(false)
    setResult(res)
    if (res.ok) window.setTimeout(onDone, 900)
  }

  return (
    <form onSubmit={submit} className="grid gap-2.5">
      <p className="text-[14px] text-slate-500 dark:text-slate-400">Choose a new password for {auth.email}.</p>
      <PasswordField value={password} onChange={setPassword} label="New password" autoComplete="new-password" />
      <button type="submit" disabled={busy} className={`${PRIMARY} mt-1`}>
        {busy ? 'Please wait…' : 'Update password'}
      </button>
      <Notice result={result} />
    </form>
  )
}

function ProfileView({
  auth,
  onClose,
  dark,
  onToggleDark,
  section,
  onChooseSection,
}: {
  auth: AuthState
  onClose: () => void
  dark: boolean
  onToggleDark: () => void
  section: string
  onChooseSection: (section: string) => void
}) {
  const [tab, setTab] = useState<'edit' | 'section'>('edit')
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoResult, setPhotoResult] = useState<AuthResult | null>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (!file) return
    setPhotoBusy(true)
    setPhotoResult(null)
    const res = await auth.uploadAvatar(file)
    setPhotoBusy(false)
    setPhotoResult(res.ok ? null : res)
  }

  return (
    <div>
      <ProfileTabs tab={tab} onChange={setTab} />
      {tab === 'section' ? (
        <SectionPanel section={section} onChoose={onChooseSection} />
      ) : (
        <>
      <div className="flex flex-col items-center gap-2 pb-4 pt-1">
        <Avatar url={auth.profile?.avatar_url} name={auth.profile?.display_name} email={auth.email} className="size-24 text-[36px]" />
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={photoBusy}
          className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-black/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          <Camera className="size-4" aria-hidden="true" />
          {photoBusy ? 'Uploading…' : auth.profile?.avatar_url ? 'Change photo' : 'Add photo'}
        </button>
        <Notice result={photoResult} />
      </div>

      <ProfileForm key={`${auth.userId}-${auth.profile ? 'loaded' : 'loading'}`} auth={auth} />
        </>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={dark}
        onClick={onToggleDark}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:border-white/10"
      >
        <span className="flex items-center gap-2">
          {dark ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
          Dark mode
        </span>
        <span className={`relative h-6 w-10 rounded-full transition-colors ${dark ? 'bg-[#30D158]' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${dark ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
      </button>

      <button
        type="button"
        onClick={async () => {
          await auth.signOut()
          onClose()
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[15px] font-semibold text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B30]/50"
      >
        <LogOut className="size-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  )
}

// Edit / Section switcher shown at the top of the profile sheet.
function ProfileTabs({ tab, onChange }: { tab: 'edit' | 'section'; onChange: (tab: 'edit' | 'section') => void }) {
  return (
    <div className="mb-3 flex gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10" role="group" aria-label="Profile options">
      {(['edit', 'section'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={tab === t}
          className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold transition-colors ${
            tab === t
              ? 'ios-active'
              : 'text-slate-600 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:text-slate-300 dark:hover:bg-white/10'
          }`}
        >
          {t === 'edit' ? 'Edit' : 'Section'}
        </button>
      ))}
    </div>
  )
}

// Shows the currently chosen section and lets the user switch; saves instantly.
function SectionPanel({ section, onChoose }: { section: string; onChoose: (section: string) => void }) {
  return (
    <div className="pb-1">
      <div className="mb-3 flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.04]">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Current section</span>
        <span className="text-[15px] font-semibold tabular-nums">{section}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChoose(s)}
            aria-pressed={section === s}
            className={`rounded-full px-1 py-2 text-[13px] font-semibold tabular-nums transition ${
              section === s
                ? 'ios-active'
                : 'text-slate-600 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-slate-400 dark:text-slate-500">The routine updates as soon as you pick a section.</p>
    </div>
  )
}

function ProfileForm({ auth }: { auth: AuthState }) {
  const [name, setName] = useState(auth.profile?.display_name ?? '')
  const [bio, setBio] = useState(auth.profile?.bio ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AuthResult | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setResult(null)
    const res = await auth.saveProfile({ display_name: name, bio })
    setBusy(false)
    setResult(res)
  }

  return (
    <form onSubmit={submit} className="grid gap-2.5">
      <div className="grid gap-1">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Email</span>
        <p className="rounded-xl bg-black/[0.03] px-3 py-2.5 text-[15px] text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">{auth.email}</p>
      </div>
      <label className="grid gap-1">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Name</span>
        <input
          type="text"
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your name"
          className={FIELD}
        />
      </label>
      <label className="grid gap-1">
        <span className="flex items-center justify-between text-[12px] font-medium text-slate-500 dark:text-slate-400">
          <span>Bio</span>
          <span className="tabular-nums">
            {bio.length}/{BIO_MAX}
          </span>
        </span>
        <textarea
          value={bio}
          maxLength={BIO_MAX}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="A line about you"
          className={`${FIELD} resize-none`}
        />
      </label>
      <button type="submit" disabled={busy} className={`${PRIMARY} mt-1`}>
        {busy ? 'Saving…' : 'Save profile'}
      </button>
      <Notice result={result} />
    </form>
  )
}
