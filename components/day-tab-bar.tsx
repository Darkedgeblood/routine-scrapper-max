'use client'

import { DAYS } from '@/lib/routine-data'
import { toDateKey, type Reminder } from '@/lib/reminders'
import { getToday, type RoutineDay } from '@/lib/routine-view'

const IOS_BLUE = 'text-[#007AFF] dark:text-[#0A84FF]'

type DayTabBarProps = {
  tabDay: RoutineDay
  onSelectDay: (day: RoutineDay) => void
  weekDates: Date[] | null
  weekCounts: Record<RoutineDay, number>
  pendingByDate: Record<string, Reminder[]>
  isMounted: boolean
  now: Date | null
}

export function DayTabBar({ tabDay, onSelectDay, weekDates, weekCounts, pendingByDate, isMounted, now }: DayTabBarProps) {
  return (
    <nav aria-label="Select a day" className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-3xl px-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="ios-tabbar relative flex rounded-3xl px-2 py-2">
          <span aria-hidden="true" className="ios-tab-indicator pointer-events-none absolute bottom-2 left-2 top-2 rounded-2xl bg-black/5 dark:bg-white/10" style={{
            width: `calc((100% - 16px) / ${DAYS.length})`,
            transform: `translateX(${DAYS.indexOf(tabDay) * 100}%)`,
          }} />
          {DAYS.map((day, index) => {
            const isToday = isMounted && now !== null && day === getToday(now)
            const active = tabDay === day
            const count = weekCounts[day]
            const hasDue = weekDates ? (pendingByDate[toDateKey(weekDates[index])]?.length ?? 0) > 0 : false
            return (
              <button key={day} type="button" onClick={() => onSelectDay(day)} aria-current={isToday ? 'date' : undefined} aria-pressed={active} className="ios-pressable relative z-10 flex min-h-11 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:focus-visible:ring-[#0A84FF]/60">
                <span className={`text-[10px] font-semibold uppercase tracking-wide transition-colors duration-200 ${active ? IOS_BLUE : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>
                <span className={`text-[14px] font-bold tabular-nums transition-colors duration-200 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{weekDates ? weekDates[index].getDate() : '·'}</span>
                <span className="text-[9px] font-medium tabular-nums text-slate-400 dark:text-slate-500">{count > 0 ? `${count} class${count === 1 ? '' : 'es'}` : ' '}</span>
                {isToday && <span aria-label="Today" className={`mt-0.5 size-1 rounded-full ${IOS_BLUE}`} />}
                {hasDue && <span aria-label="Has a reminder due" className="absolute right-2 top-1.5 size-1.5 rounded-full bg-[#FF3B30]" />}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
