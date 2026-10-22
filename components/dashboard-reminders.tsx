'use client'

import { useAuth } from '@/lib/auth'
import { ReminderRow, TYPE_META } from '@/components/reminder-sheet'
import type { Reminder } from '@/lib/reminders'

type DashboardRemindersProps = {
  auth: ReturnType<typeof useAuth>
  dayReminders: Reminder[]
  dayDoneCount: number
  isViewingToday: boolean
  now: Date | null
  onOpenAccount: () => void
  onToggle: (id: string) => void | Promise<void>
}

export function DashboardReminders({ auth, dayReminders, dayDoneCount, isViewingToday, now, onOpenAccount, onToggle }: DashboardRemindersProps) {
  return (
    <section className="panel mt-3 rounded-3xl p-4">
      <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500" aria-label="Reminder types">
        {(['quiz', 'assignment', 'presentation'] as const).map((type) => {
          const Icon = TYPE_META[type].Icon
          return <Icon key={type} aria-hidden="true" className="size-4" />
        })}
      </div>
      {!auth.user ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[14px] text-slate-400 dark:text-slate-500">Sign in to sync your reminders.</p>
          <button type="button" onClick={onOpenAccount} className="ios-active shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:focus-visible:ring-[#0A84FF]/60">Sign in</button>
        </div>
      ) : dayReminders.length > 0 && now ? (
        <div className="mt-2 divide-y divide-slate-200 dark:divide-white/10">
          {dayReminders.map((reminder) => <ReminderRow key={reminder.id} reminder={reminder} now={now} onToggle={onToggle} showDate={false} />)}
        </div>
      ) : (
        <div className="mt-2 text-slate-400 dark:text-slate-500">
          <p className="text-[14px]">
            {dayDoneCount > 0
              ? `All reminders completed ${isViewingToday ? 'today' : 'for this day'}.`
              : `No reminders due ${isViewingToday ? 'today' : 'on this day'}.`}
          </p>
        </div>
      )}
    </section>
  )
}
