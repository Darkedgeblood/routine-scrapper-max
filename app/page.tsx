'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, CalendarDays, Clock, Coffee, MapPin, Moon, RotateCcw, Sun, Users } from 'lucide-react'

import {
  DAYS,
  FULL_DAYS,
  MY_SKIPPED_COURSES,
  MY_SKIPPED_LABS,
  PERSONAL_DATA,
  ROUTINE_DATA,
  SECTIONS,
  TEACHERS,
  type RoutineItem,
} from '@/lib/routine-data'

// Shared focus ring for every interactive element.
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:focus-visible:ring-[#0A84FF]/60'

// iOS system blue — used only for functional accents (selection, live status).
const IOS_BLUE = 'text-[#007AFF] dark:text-[#0A84FF]'

// Returns today's key, or null on a day with no classes (Friday).
function getToday(date = new Date()): (typeof DAYS)[number] | null {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
  return DAYS.includes(day as (typeof DAYS)[number]) ? (day as (typeof DAYS)[number]) : null
}

// Dates for the Sat-Thu week shown in the day tabs (on Friday it shows the coming week).
function getWeekDates(today: Date) {
  const start = new Date(today)
  const sinceSat = (start.getDay() + 1) % 7 // Sat=0 … Thu=5, Fri=6
  start.setDate(start.getDate() - (sinceSat === 6 ? -1 : sinceSat))
  return DAYS.map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function isSkippedCourse(item: RoutineItem, personal: boolean) {
  return personal && MY_SKIPPED_COURSES.includes(item.courseCode)
}

// Classes shown greyed out (personal mode only); they don't count towards "next up" or totals.
function isInactive(item: RoutineItem, personal: boolean) {
  return (
    isSkippedCourse(item, personal) ||
    (personal && !!item.subSection && MY_SKIPPED_LABS.includes(item.subSection))
  )
}

function teacherLabel(initials: string) {
  return TEACHERS[initials] || initials
}

function formatCountdown(totalMinutes: number) {
  if (totalMinutes <= 0) return 'now'
  if (totalMinutes < 60) return `${totalMinutes}m`
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
}

export default function Page() {
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS)[number]>('Sat')
  const [now, setNow] = useState<Date | null>(null)
  const [dark, setDark] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedSection, setSelectedSection] = useState('69_P')
  const [personal, setPersonal] = useState(false)
  const tapCount = useRef(0)
  const tapTimer = useRef<number | undefined>(undefined)

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashFading, setIsSplashFading] = useState(false)

  useEffect(() => {
    const today = getToday() ?? 'Sat'

    // Restore the last-viewed day (falls back to today).
    const savedDay = window.localStorage.getItem('routine-day')
    setSelectedDay(savedDay && (DAYS as readonly string[]).includes(savedDay) ? (savedDay as (typeof DAYS)[number]) : today)

    // Restore dark mode (defaults to dark).
    const savedDark = window.localStorage.getItem('routine-dark')
    const startDark = savedDark ? savedDark === '1' : true
    setDark(startDark)

    const savedSection = window.localStorage.getItem('routine-section')
    if (savedSection && SECTIONS.includes(savedSection)) setSelectedSection(savedSection)
    if (window.localStorage.getItem('routine-personal') === '1') setPersonal(true)

    setNow(new Date())
    setIsMounted(true)

    // The clock only shows hours and minutes, so tick once per minute (on the minute) instead of every second.
    let clockTimer: number
    const tick = () => {
      setNow(new Date())
      clockTimer = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
    }
    clockTimer = window.setTimeout(tick, 60000 - (Date.now() % 60000) + 50)

    // Trigger splash fade out at 1.4s, completely unmount at 1.9s
    const fadeTimer = window.setTimeout(() => setIsSplashFading(true), 1400)
    const exitTimer = window.setTimeout(() => setShowSplash(false), 1900)

    return () => {
      window.clearTimeout(clockTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(exitTimer)
    }
  }, [])

  // Tap the logo 5 times quickly to switch personal mode on or off.
  const handleLogoTap = () => {
    tapCount.current += 1
    window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => {
      tapCount.current = 0
    }, 1500)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      const next = !personal
      setPersonal(next)
      window.localStorage.setItem('routine-personal', next ? '1' : '0')
    }
  }

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    window.localStorage.setItem('routine-dark', next ? '1' : '0')
    // Keep the browser UI/status bar color in sync with the scene.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#000000' : '#F2F2F7')
  }

  const selectDay = (day: (typeof DAYS)[number]) => {
    setSelectedDay(day)
    window.localStorage.setItem('routine-day', day)
  }

  const chooseSection = (section: string) => {
    if (!SECTIONS.includes(section)) return
    setSelectedSection(section)
    window.localStorage.setItem('routine-section', section)
  }

  const dayClasses = useMemo(
    () =>
      (personal ? [...ROUTINE_DATA, ...PERSONAL_DATA] : ROUTINE_DATA)
        .filter((item) => item.day === FULL_DAYS[selectedDay] && (item.section === selectedSection || item.isRetake))
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [selectedDay, selectedSection, personal]
  )

  // How many active classes each day of the week has (shown under each day tab).
  const weekCounts = useMemo(() => {
    const source = personal ? [...ROUTINE_DATA, ...PERSONAL_DATA] : ROUTINE_DATA
    const counts = {} as Record<(typeof DAYS)[number], number>
    for (const day of DAYS) {
      counts[day] = source.filter(
        (item) =>
          item.day === FULL_DAYS[day] &&
          (item.section === selectedSection || item.isRetake) &&
          !isInactive(item, personal)
      ).length
    }
    return counts
  }, [selectedSection, personal])

  const sectionHasData = useMemo(
    () => ROUTINE_DATA.some((item) => item.section === selectedSection),
    [selectedSection]
  )

  const totalDurationMinutes = dayClasses
    .filter((item) => !isInactive(item, personal))
    .reduce((total, item) => total + item.endMinutes - item.startMinutes, 0)
  const totalDurationLabel = `Total: ${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
  const regularCount = dayClasses.filter((item) => !item.isRetake && !isSkippedCourse(item, personal)).length
  const retakeItems = dayClasses.filter((item) => item.isRetake)
  const retakeCount = retakeItems.length
  const retakeCourses = [...new Set(retakeItems.map((item) => item.courseCode))]
  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1
  const weekDates = useMemo(() => (now ? getWeekDates(now) : null), [now])
  const selectedDate = weekDates ? weekDates[DAYS.indexOf(selectedDay)] : null
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : ''
  const isViewingToday = isMounted && now !== null && selectedDay === getToday(now)
  // Friday has no tab; the tabs then show the coming week.
  const isNextWeek = isMounted && now !== null && getToday(now) === null
  const activeClasses = dayClasses.filter((item) => !isInactive(item, personal))
  const ongoingClass = isViewingToday
    ? activeClasses.find((item) => item.startMinutes <= currentMinutes && currentMinutes < item.endMinutes)
    : undefined
  // Only compare against the clock when the selected day is today; otherwise show the day's first class.
  const upcomingClass = isViewingToday
    ? activeClasses.find((item) => item.startMinutes > currentMinutes)
    : activeClasses[0]
  const upNextLabel = isViewingToday ? 'Next up' : 'First class'
  const upNextEmpty = isViewingToday && activeClasses.length > 0 ? 'No more classes' : 'No classes'

  const upNextDetail = upcomingClass
    ? `${upcomingClass.courseCode} · ${upcomingClass.startTime} - ${upcomingClass.endTime}`
    : upNextEmpty
  // A secondary line under "next up": live status when viewing today.
  const upNextSub =
    isViewingToday && now !== null
      ? ongoingClass
        ? `In session · ends ${ongoingClass.endTime}`
        : upcomingClass
        ? `Starts in ${formatCountdown(upcomingClass.startMinutes - currentMinutes)}`
        : ''
      : ''

  // Live status shown in the footer dot.
  const liveStatus = !isMounted || now === null
    ? { dot: 'bg-slate-400', label: 'Live schedule', pulse: false }
    : !isViewingToday
    ? { dot: 'bg-slate-400', label: `Viewing ${FULL_DAYS[selectedDay]}`, pulse: false }
    : ongoingClass
    ? { dot: 'bg-[#30D158]', label: `In session · ${ongoingClass.courseCode}`, pulse: true }
    : upcomingClass
    ? { dot: 'bg-[#FF9F0A]', label: `Next class ${upcomingClass.startTime}`, pulse: false }
    : activeClasses.length > 0
    ? { dot: 'bg-slate-400', label: 'No more classes today', pulse: false }
    : { dot: 'bg-slate-400', label: 'No classes today', pulse: false }

  return (
    <>
      {/* Launch Splash Screen Overlay */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none ${
            isSplashFading ? 'animate-splash-fade' : ''
          }`}
        >
          <img
            src="/app-icon.png"
            alt="Routine Scrapper Max"
            className="size-36 object-contain animate-app-intro"
          />
          <h1 className="mt-5 text-xl font-bold tracking-tight text-white">
            Routine Scrapper Max
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            CSE Batch 69
          </p>
        </div>
      )}

      {/* Main Routine App View */}
      <main className={dark ? 'dark ios-scene min-h-screen text-slate-900 dark:text-slate-100' : 'ios-scene min-h-screen text-slate-900'}>
        <div className="relative z-10 mx-auto min-h-screen max-w-3xl px-4 pb-32 pt-6 sm:px-6">

          {/* iOS Large Title header */}
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogoTap}
                aria-label="Toggle personal mode"
                className={`panel flex size-11 shrink-0 items-center justify-center rounded-2xl text-slate-900 dark:text-slate-100 ${FOCUS_RING}`}
              >
                <CalendarDays className="size-5" />
              </button>
              <div>
                <h1 className="text-[32px] font-bold leading-tight tracking-tight">
                  Routine
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {personal ? 'Personal schedule' : 'CSE · Batch 69'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleDark}
              className={`panel flex size-11 items-center justify-center rounded-full text-slate-600 transition dark:text-slate-300 ${FOCUS_RING}`}
            >
              {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </header>

          {/* Compact live status card */}
          <section className="panel mt-6 rounded-3xl p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p role="timer" aria-live="off" className="text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
                  {isMounted && now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 AM'}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {isMounted && now ? now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading date…'}
                  {selectedDateLabel ? ` · ${FULL_DAYS[selectedDay]} ${selectedDateLabel}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{upNextLabel}</p>
                <p className="mt-1 text-[15px] font-semibold">{upNextDetail}</p>
                {upNextSub && (
                  <p className={`mt-0.5 text-[13px] font-medium ${ongoingClass ? 'text-[#30D158]' : IOS_BLUE}`}>
                    {upNextSub}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Today at a glance */}
          <section className={`mt-3 grid gap-3 ${personal ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="panel flex items-center gap-3 rounded-3xl p-4">
              <BookOpen className="size-5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none tabular-nums">{regularCount}</p>
                <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">classes today</p>
              </div>
            </div>
            <div className="panel flex items-center gap-3 rounded-3xl p-4">
              <Clock className="size-5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none tabular-nums">
                  {Math.floor(totalDurationMinutes / 60)}h{totalDurationMinutes % 60 > 0 ? ` ${totalDurationMinutes % 60}m` : ''}
                </p>
                <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">class time</p>
              </div>
            </div>
            {personal && (
              <div className="panel flex items-center gap-3 rounded-3xl p-4">
                <RotateCcw className="size-5 shrink-0 text-amber-500" />
                <div className="min-w-0">
                  <p className="text-xl font-bold leading-none tabular-nums">{retakeCount}</p>
                  <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    retake{retakeCourses.length > 0 ? ` · ${retakeCourses.join(', ')}` : ''}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Section segmented control */}
          <section className="panel mt-3 rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Section</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{selectedSection}</p>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
              {SECTIONS.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => chooseSection(section)}
                  aria-pressed={selectedSection === section}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
                    selectedSection === section
                      ? 'ios-active'
                      : `text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10 ${FOCUS_RING}`
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </section>

          {/* Schedule (iOS inset grouped list) */}
          <section className="mt-7">
            <div className="mb-3 flex items-end justify-between gap-4 px-1">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight">{FULL_DAYS[selectedDay]}</h2>
                <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                  {dayClasses.length
                    ? `${dayClasses.length} classes from your routine`
                    : sectionHasData
                    ? 'A clear day — no classes scheduled.'
                    : `No routine added for ${selectedSection} yet.`}
                </p>
              </div>
              {totalDurationMinutes > 0 && (
                <p className="shrink-0 pb-0.5 text-right text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  {totalDurationLabel}
                </p>
              )}
            </div>

            {isNextWeek && (
              <p className="mb-3 px-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                No classes today (Friday) — showing next week.
              </p>
            )}

            {!sectionHasData && (
              <div className="panel panel-dim mb-3 rounded-2xl px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">
                No regular routine has been added for {selectedSection} yet.{personal ? ' Only your personal sessions are shown.' : ''}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {dayClasses.map((item, index) => {
                const previous = dayClasses[index - 1]
                const gap = previous ? item.startMinutes - previous.endMinutes : 0
                const gapHours = Math.floor(gap / 60)
                const gapMins = gap % 60
                const inactive = isInactive(item, personal)
                const ongoing = ongoingClass?.id === item.id
                const skippedLabel = isSkippedCourse(item, personal) ? 'Not registered' : inactive ? `${item.subSection} Lab (skipped)` : ''

                return (
                  <Fragment key={item.id}>
                    {gap > 0 && previous && (
                      <div className="break-stripes flex items-center justify-between rounded-2xl px-4 py-3 text-slate-500 dark:text-slate-400">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Break Time</p>
                          <p className="mt-1 text-[12px] tabular-nums">
                            {previous.endTime} - {item.startTime} ({gapHours}h {gapMins}m)
                          </p>
                        </div>
                        <Coffee className="size-4" aria-hidden="true" />
                      </div>
                    )}
                    <article
                      className={`panel flex items-stretch gap-3.5 rounded-2xl p-4 transition-colors sm:gap-5 ${
                        ongoing
                          ? 'ios-now'
                          : inactive
                          ? 'panel-dim opacity-50 grayscale'
                          : 'hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex w-[62px] shrink-0 flex-col justify-center border-r border-slate-200 pr-3 dark:border-white/10 sm:w-[84px] sm:pr-5">
                        <span className="text-[15px] font-semibold tabular-nums">{item.startTime}</span>
                        <span className="my-1 h-px w-3 bg-slate-300 dark:bg-slate-600" />
                        <span className="text-[12px] tabular-nums text-slate-400 dark:text-slate-500">{item.endTime}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-[16px] font-semibold ${inactive ? 'line-through' : ''}`}>
                            {item.courseCode}
                          </h3>
                          {ongoing && (
                            <span className="rounded-full bg-[#007AFF]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]">
                              Now
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              inactive
                                ? 'bg-black/5 text-slate-400 dark:bg-white/10 dark:text-slate-500'
                                : item.isRetake
                                ? 'bg-amber-400/25 text-amber-700 dark:bg-amber-300/15 dark:text-amber-300'
                                : 'bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            }`}
                          >
                            {inactive ? skippedLabel : item.isRetake ? 'Retake' : `Section ${item.section}`}
                          </span>
                          {item.subSection && (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                              {item.subSection}
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 text-[14px] ${inactive ? 'line-through text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.courseTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-400 dark:text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" /> {item.room}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5"
                            title={TEACHERS[item.teacher] ? item.teacher : undefined}
                          >
                            <Users className="size-3.5" /> {teacherLabel(item.teacher)}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Fragment>
                )
              })}
            </div>
          </section>

          <footer className="mt-10 flex flex-col items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${liveStatus.dot} ${liveStatus.pulse ? 'animate-pulse' : ''}`} /> {liveStatus.label}
            </span>
            <span>Routine V4.0 · Effective 26 September 2026</span>
          </footer>
        </div>

        {/* iOS-style floating day tab bar */}
        <nav aria-label="Select a day" className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-3xl px-4 pb-4">
            <div className="ios-tabbar flex rounded-3xl px-2 py-2">
              {DAYS.map((day, i) => {
                const isToday = isMounted && now !== null && day === getToday(now)
                const active = selectedDay === day
                const count = weekCounts[day]
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={active}
                    className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition ${FOCUS_RING}`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? IOS_BLUE : 'text-slate-400 dark:text-slate-500'}`}>
                      {day}
                    </span>
                    <span className={`text-[14px] font-bold tabular-nums ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {weekDates ? weekDates[i].getDate() : '·'}
                    </span>
                    <span className="text-[9px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                      {count > 0 ? `${count} class${count === 1 ? '' : 'es'}` : ' '}
                    </span>
                    {isToday && (
                      <span aria-label="Today" className={`mt-0.5 size-1 rounded-full ${IOS_BLUE}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </main>
    </>
  )
}
