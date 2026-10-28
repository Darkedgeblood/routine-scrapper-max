'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

import { APP_CHANGELOG, APP_CHANGELOG_STORAGE_KEY, shouldShowAppChangelog } from '@/lib/app-changelog'

export function ChangelogPopup({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    try {
      const lastSeenId = window.localStorage.getItem(APP_CHANGELOG_STORAGE_KEY)
      setVisible(shouldShowAppChangelog(lastSeenId))
    } catch {
      // Keep the announcement available if storage is disabled on the device.
      setVisible(true)
    }
  }, [enabled])

  const dismiss = () => {
    try {
      window.localStorage.setItem(APP_CHANGELOG_STORAGE_KEY, APP_CHANGELOG.id)
    } catch {
      // The current session can still dismiss it when storage is unavailable.
    }
    setVisible(false)
  }

  if (!enabled || !visible) return null

  return (
    <aside
      aria-labelledby="app-changelog-title"
      className="panel fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 mx-auto max-w-xl rounded-2xl p-4 shadow-xl sm:inset-x-6 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]" aria-hidden="true">
          <Sparkles className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="app-changelog-title" className="text-[17px] font-bold leading-tight tracking-tight">What’s new</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">Updated {APP_CHANGELOG.date}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss update notes"
              className="ios-pressable -mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:focus-visible:ring-[#0A84FF]/60"
            >
              <X className="size-[18px]" />
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
            {APP_CHANGELOG.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-[#007AFF] dark:bg-[#0A84FF]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
