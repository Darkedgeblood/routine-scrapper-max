'use client'

import { CircleAlert, Download, Plus, Settings2, X } from 'lucide-react'

import { Avatar } from '@/components/account-sheet'
import type { PersonalRoutineStatus } from '@/hooks/use-personal-routine'
import type { useAuth } from '@/lib/auth'
import type { AppUpdate } from '@/lib/app-updates'
import { formatApkVersion } from '@/lib/app-version'
import type { ScheduleNotice } from '@/lib/schedule-changes'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:focus-visible:ring-[#0A84FF]/60'

type DashboardHeaderProps = {
  auth: ReturnType<typeof useAuth>
  sectionLabel: string
  pendingCount: number
  isMounted: boolean
  personal: boolean
  personalRoutineStatus: PersonalRoutineStatus
  onRetryPersonalRoutine: () => void
  scheduleNotice: ScheduleNotice | null
  onDismissScheduleNotice: () => void
  appUpdate: AppUpdate | null
  onOpenReminders: () => void
  onOpenFeatures: () => void
  onOpenAccount: () => void
  onStartApkUpdate: (url: string) => void
}

export function DashboardHeader({
  auth,
  sectionLabel,
  pendingCount,
  isMounted,
  personal,
  personalRoutineStatus,
  onRetryPersonalRoutine,
  scheduleNotice,
  onDismissScheduleNotice,
  appUpdate,
  onOpenReminders,
  onOpenFeatures,
  onOpenAccount,
  onStartApkUpdate,
}: DashboardHeaderProps) {
  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate whitespace-nowrap text-[26px] font-bold leading-none tracking-tight sm:text-[32px]">Routine</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{sectionLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onOpenReminders}
            aria-label={isMounted && pendingCount > 0 ? `Reminders, ${pendingCount} pending` : 'Add a quiz, assignment or presentation'}
            className={`ios-pressable panel relative flex size-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 sm:size-11 ${FOCUS_RING}`}
          >
            <Plus className="size-5" />
            {isMounted && pendingCount > 0 && (
              <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#FF3B30] px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-[#f2f2f7] dark:ring-black">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
          <button type="button" onClick={onOpenFeatures} aria-label="Routine settings and tools" className={`ios-pressable panel flex size-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 sm:size-11 ${FOCUS_RING}`}>
            <Settings2 className="size-5" />
          </button>
          <button type="button" onClick={onOpenAccount} aria-label={auth.user ? 'Your profile' : 'Sign in'} className={`ios-pressable panel flex size-10 items-center justify-center overflow-hidden rounded-full text-slate-600 dark:text-slate-300 sm:size-11 ${FOCUS_RING}`}>
            {auth.loading ? (
              <span aria-hidden="true" className="size-5 animate-pulse rounded-full bg-slate-300/60 dark:bg-white/15" />
            ) : auth.user ? (
              <Avatar url={auth.profile?.avatar_url} name={auth.profile?.display_name} email={auth.email} className="size-10 text-[16px] sm:size-11" />
            ) : (
              <Avatar className="size-11 text-[16px]" />
            )}
          </button>
        </div>
      </header>

      {personal && personalRoutineStatus !== 'ready' && (
        <div role={personalRoutineStatus === 'error' || personalRoutineStatus === 'missing' ? 'alert' : 'status'} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#FF9F0A]/20 bg-[#FF9F0A]/[0.08] px-3 py-2 text-[12px] text-slate-600 dark:text-slate-300">
          <span>
            {personalRoutineStatus === 'loading'
              ? 'Loading your private retake routine…'
              : personalRoutineStatus === 'missing'
                ? 'Your private retake routine is missing from this app’s connected database.'
                : 'Could not load your private retake routine. Check your connection and try again.'}
          </span>
          {(personalRoutineStatus === 'error' || personalRoutineStatus === 'missing') && (
            <button type="button" onClick={onRetryPersonalRoutine} className={`shrink-0 rounded-full px-2 py-1 font-semibold text-[#007AFF] dark:text-[#0A84FF] ${FOCUS_RING}`}>Retry</button>
          )}
        </div>
      )}

      {scheduleNotice && (
        <section role="status" className="panel mt-3 flex items-start gap-2.5 rounded-2xl border border-[#007AFF]/20 p-3 dark:border-[#0A84FF]/20">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
          <div className="min-w-0 flex-1">
            <button type="button" onClick={onOpenFeatures} className={`block w-full text-left ${FOCUS_RING}`}>
              <span className="block text-[13px] font-semibold">{scheduleNotice.title}</span>
              <span className="mt-0.5 block truncate text-[12px] text-slate-500 dark:text-slate-400">{scheduleNotice.lines[0]}</span>
            </button>
          </div>
          <button type="button" onClick={onDismissScheduleNotice} aria-label="Dismiss routine update" className={`flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 ${FOCUS_RING}`}>
            <X className="size-4" />
          </button>
        </section>
      )}

      {appUpdate && (
        <section role="status" className="panel mt-3 flex items-center gap-3 rounded-2xl border border-[#007AFF]/20 p-3 dark:border-[#0A84FF]/20">
          <Download className="size-5 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">{appUpdate.critical ? 'Important app update available' : 'App update available'}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">Tap to download version {formatApkVersion(appUpdate.build)}.</p>
          </div>
          <button type="button" onClick={() => onStartApkUpdate(appUpdate.apkUrl)} className={`shrink-0 rounded-full bg-[#007AFF] px-3 py-2 text-[12px] font-semibold text-white dark:bg-[#0A84FF] ${FOCUS_RING}`}>Update</button>
        </section>
      )}
    </>
  )
}
