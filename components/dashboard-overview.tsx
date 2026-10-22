'use client'

import { BookOpen, Clock } from 'lucide-react'

type DashboardOverviewProps = {
  clockLabel: string
  dateLabel: string
  upNextLabel: string
  upNextDetail: string
  upNextSub: string
  ongoing: boolean
  regularCount: number
  totalDurationMinutes: number
}

const IOS_BLUE = 'text-[#007AFF] dark:text-[#0A84FF]'

export function DashboardOverview({
  clockLabel,
  dateLabel,
  upNextLabel,
  upNextDetail,
  upNextSub,
  ongoing,
  regularCount,
  totalDurationMinutes,
}: DashboardOverviewProps) {
  return (
    <>
      <section className="panel mt-5 rounded-3xl p-4 sm:mt-6 sm:p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p role="timer" aria-live="off" className="text-[38px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">{clockLabel}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{dateLabel}</p>
        </div>
        <div className="mt-5 min-w-0 border-t border-slate-200 pt-3 dark:border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{upNextLabel}</p>
          <p className="mt-1 break-words text-[17px] font-semibold leading-snug">{upNextDetail}</p>
          {upNextSub && <p className={`mt-0.5 text-[13px] font-medium ${ongoing ? 'text-[#30D158]' : IOS_BLUE}`}>{upNextSub}</p>}
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3" aria-label="Today's schedule summary">
        <div className={`panel flex min-w-0 items-center gap-3 rounded-3xl p-4 transition-opacity ${regularCount === 0 ? 'opacity-50' : ''}`}>
          <BookOpen className="size-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-xl font-bold leading-none tabular-nums">{regularCount}</p>
            <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-slate-500 dark:text-slate-400">classes today</p>
          </div>
        </div>
        <div className={`panel flex min-w-0 items-center gap-3 rounded-3xl p-4 transition-opacity ${totalDurationMinutes === 0 ? 'opacity-50' : ''}`}>
          <Clock className="size-5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="whitespace-nowrap text-lg font-bold leading-none tabular-nums sm:text-xl">
              {Math.floor(totalDurationMinutes / 60)}h{totalDurationMinutes % 60 > 0 ? ` ${totalDurationMinutes % 60}m` : ''}
            </p>
            <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-slate-500 dark:text-slate-400">class time</p>
          </div>
        </div>
      </section>
    </>
  )
}
