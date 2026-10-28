'use client'

import { Fragment, memo, useRef, type TouchEvent } from 'react'
import { ArrowDown, CalendarDays, Coffee, MapPin, Users } from 'lucide-react'

import { DAYS, FULL_DAYS, TEACHERS, type RoutineItem } from '@/lib/routine-data'
import type { BangladeshNationalHoliday } from '@/lib/bangladesh-holidays'
import type { MidtermExam } from '@/lib/exam-routine'
import { isInactive, isOtherLabGroup, isSkippedCourse, teacherLabel, type RoutineDay } from '@/lib/routine-view'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:focus-visible:ring-[#0A84FF]/60'

type ClassScheduleProps = {
  selectedDay: RoutineDay
  tabDay: RoutineDay
  onSelectDay: (day: RoutineDay) => void
  selectedSection: string
  isNextWeek: boolean
  sectionHasData: boolean
  personal: boolean
  selectedHoliday: BangladeshNationalHoliday | null
  midtermPeriod: boolean
  midtermExams: MidtermExam[]
  highlightedCourseCodes: string[]
  visibleDayClasses: RoutineItem[]
  skippedCourses: string[]
  skippedLabs: string[]
  labGroup: string
  ongoingClass: RoutineItem | undefined
}

export const ClassSchedule = memo(function ClassSchedule({
  selectedDay,
  tabDay,
  onSelectDay,
  selectedSection,
  isNextWeek,
  sectionHasData,
  personal,
  selectedHoliday,
  midtermPeriod,
  midtermExams,
  highlightedCourseCodes,
  visibleDayClasses,
  skippedCourses,
  skippedLabs,
  labGroup,
  ongoingClass,
}: ClassScheduleProps) {
  const classListRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const finishSwipe = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.25) return
    const nextIndex = Math.min(DAYS.length - 1, Math.max(0, DAYS.indexOf(tabDay) + (dx < 0 ? 1 : -1)))
    if (nextIndex !== DAYS.indexOf(tabDay)) onSelectDay(DAYS[nextIndex])
  }

  return (
    <section className="mt-7" aria-label={`${FULL_DAYS[selectedDay]} class schedule`}>
      <div className="mb-3 flex justify-center">
        <button
          type="button"
          onClick={() => classListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-[#007AFF] motion-reduce:transition-none dark:text-slate-400 dark:hover:text-[#0A84FF] ${FOCUS_RING}`}
          aria-label={`Scroll to ${FULL_DAYS[selectedDay]} classes`}
        >
          <span className="animate-bounce motion-reduce:animate-none">Scroll down</span>
          <ArrowDown className="size-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </button>
      </div>

      {isNextWeek && <p className="mb-3 px-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">No classes today (Friday) — showing next week.</p>}

      {!selectedHoliday && !sectionHasData && (
        <div className="panel panel-dim mb-3 rounded-2xl px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">
          No regular routine has been added for {selectedSection} yet.{personal ? ' Only your personal sessions are shown.' : ''}
        </div>
      )}

      <div
        key={selectedDay}
        ref={classListRef}
        tabIndex={-1}
        className="day-content-enter flex scroll-mt-20 flex-col gap-2.5 outline-none"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={(event) => {
          const touch = event.changedTouches[0]
          if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchEnd={finishSwipe}
        onTouchCancel={() => { touchStart.current = null }}
      >
        {midtermPeriod && (
          <div className="panel panel-dim rounded-2xl px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">
            Regular classes are paused during the Batch 69 midterm exam period (Oct 28–Nov 4).
          </div>
        )}
        {midtermExams.map((exam) => (
          <article key={`${exam.date}-${exam.courseCode}`} className="panel flex items-stretch gap-3.5 rounded-2xl p-4 sm:gap-5">
            <div className="flex w-[84px] shrink-0 flex-col justify-center border-r border-slate-200 pr-3 dark:border-white/10 sm:w-[96px] sm:pr-4">
              <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums sm:text-[14px]">{exam.startTime}</span>
              <span className="my-1 h-px w-3 bg-slate-300 dark:bg-slate-600" />
              <span className="whitespace-nowrap text-[11px] tabular-nums text-slate-400 dark:text-slate-500 sm:text-[12px]">{exam.endTime}</span>
            </div>
            <div className="min-w-0 flex-1 self-center">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[16px] font-semibold">{exam.courseCode}</h3>
                <span className="rounded-full bg-[#007AFF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]">Midterm exam</span>
              </div>
              <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">{exam.courseTitle}</p>
              <p className="mt-2 text-[12px] font-medium text-slate-400 dark:text-slate-500">Batch 69</p>
              <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                {exam.seatAllocation ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-[12px] font-semibold">Room allocation · {selectedSection}</h4>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Instructor: {exam.seatAllocation.instructorInitials}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">{exam.seatAllocation.totalSeats} seats</span>
                    </div>
                    <ul className="mt-2 grid grid-cols-2 gap-1.5" aria-label={`Rooms assigned to ${selectedSection}`}>
                      {exam.seatAllocation.rooms.map(({ room, seats }) => (
                        <li key={room} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-[11px] dark:bg-white/[0.05]">
                          <span className="font-medium">Room {room}</span>
                          <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{seats} seats</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Room details for {selectedSection} aren’t available yet.</p>
                )}
              </div>
            </div>
          </article>
        ))}
        {selectedHoliday ? (
          <article className="panel flex items-center gap-3 rounded-2xl p-4">
            <CalendarDays className="size-6 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold">{selectedHoliday.name} Holiday</h3>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">No classes scheduled today.</p>
            </div>
          </article>
        ) : visibleDayClasses.map((item, index) => {
          const previous = visibleDayClasses[index - 1]
          const gap = previous ? item.startMinutes - previous.endMinutes : 0
          const gapHours = Math.floor(gap / 60)
          const gapMins = gap % 60
          const inactive = isInactive(item, skippedCourses, skippedLabs, labGroup)
          const ongoing = ongoingClass?.id === item.id
          const hasDueReminder = highlightedCourseCodes.includes(item.courseCode)
          const inactiveLabel = isSkippedCourse(item, skippedCourses)
            ? 'Not registered'
            : isOtherLabGroup(item, labGroup)
              ? 'Other group'
              : inactive ? `${item.subSection} Lab (skipped)` : ''

          return (
            <Fragment key={item.id}>
              {gap > 0 && previous && (
                <div className="break-stripes flex items-center justify-between rounded-2xl px-4 py-3 text-slate-500 dark:text-slate-400">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Break Time</p>
                    <p className="mt-1 text-[12px] tabular-nums">{previous.endTime} - {item.startTime} ({gapHours}h {gapMins}m)</p>
                  </div>
                  <Coffee className="size-4" aria-hidden="true" />
                </div>
              )}
              <article className={`panel flex items-stretch gap-3.5 rounded-2xl p-4 transition-colors sm:gap-5 ${
                hasDueReminder ? 'ring-2 ring-inset ring-[#FFCC00]/80 dark:ring-[#FFD60A]/80' : ''
              } ${
                ongoing ? 'ios-now' : inactive ? 'panel-dim opacity-50 grayscale' : 'hover:border-slate-300 dark:hover:border-slate-600'
              }`}>
                <div className="flex w-[84px] shrink-0 flex-col justify-center border-r border-slate-200 pr-3 dark:border-white/10 sm:w-[96px] sm:pr-4">
                  <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums sm:text-[14px]">{item.startTime}</span>
                  <span className="my-1 h-px w-3 bg-slate-300 dark:bg-slate-600" />
                  <span className="whitespace-nowrap text-[11px] tabular-nums text-slate-400 dark:text-slate-500 sm:text-[12px]">{item.endTime}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-[16px] font-semibold ${inactive ? 'line-through' : ''}`}>{item.courseCode}</h3>
                    {ongoing && <span className="rounded-full bg-[#007AFF]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]">Now</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      inactive
                        ? 'bg-black/5 text-slate-400 dark:bg-white/10 dark:text-slate-500'
                        : item.isRetake
                          ? 'bg-amber-400/25 text-amber-700 dark:bg-amber-300/15 dark:text-amber-300'
                          : 'bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                    }`}>{inactive ? inactiveLabel : item.isRetake ? 'Retake' : `Section ${item.section}`}</span>
                    {item.subSection && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">{item.subSection}</span>}
                  </div>
                  <p className={`mt-1 text-[14px] ${inactive ? 'line-through text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{item.courseTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-400 dark:text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {item.room}</span>
                    <span className="inline-flex items-center gap-1.5" title={TEACHERS[item.teacher] ? item.teacher : undefined}><Users className="size-3.5" /> {teacherLabel(item.teacher)}</span>
                  </div>
                </div>
              </article>
            </Fragment>
          )
        })}
      </div>

    </section>
  )
})
