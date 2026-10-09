'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, Coffee, MapPin, Moon, Search, Sun, Users, Zap } from 'lucide-react'
import { Archivo_Black } from 'next/font/google'

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

// Initialize Archivo Black (it only has a '400' weight)
const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
})

// Shared focus ring for every interactive element.
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70 dark:focus-visible:ring-cyan-300/70'

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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#000000' : '#e7edf4')
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

  // How many active classes each day of the week has (drives the count under each day pill).
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
  // Friday has no tab; the pills then show the coming week.
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
    ? { dot: 'bg-emerald-400', label: `In session · ${ongoingClass.courseCode}`, pulse: true }
    : upcomingClass
    ? { dot: 'bg-amber-400', label: `Next class ${upcomingClass.startTime}`, pulse: false }
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
          <h1 className="mt-5 font-mono text-xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            Routine Scrapper Max
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            CSE Batch 69
          </p>
        </div>
      )}

      {/* Main Routine App View */}
      <main className={dark ? 'dark glass-scene min-h-screen text-slate-100' : 'glass-scene min-h-screen text-slate-900'}>
        <div className="relative z-10 mx-auto min-h-screen max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogoTap}
                aria-label="Toggle personal mode"
                className={`flex size-10 cursor-default select-none items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 ${FOCUS_RING}`}
              >
                <CalendarDays />
              </button>
              <div>
                <p className="text-lg font-semibold tracking-tight">Routine</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">CSE · Batch 69{personal ? ' · Personal' : ''}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleDark}
              className={`glass glass-hover flex size-10 items-center justify-center rounded-full text-slate-600 transition dark:text-slate-300 ${FOCUS_RING}`}
            >
              {dark ? <Sun /> : <Moon />}
            </button>
          </header>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="glass rounded-[2rem] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cyan-800 dark:text-cyan-300">{FULL_DAYS[selectedDay]}{selectedDateLabel ? ` · ${selectedDateLabel}` : ''}</p>
                  <h1 className={`mt-2 text-3xl tracking-tight sm:text-4xl ${archivoBlack.className}`}>
                    Your classes, <span className="text-cyan-800 dark:text-cyan-300">at a glance.</span>
                  </h1>
                </div>
                <Zap className="mt-1 text-cyan-800 dark:text-cyan-300" />
              </div>
              <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p role="timer" aria-live="off" className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                    {isMounted && now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 AM'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {isMounted && now ? now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading date…'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{upNextLabel}</p>
                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                    {upNextDetail}
                  </p>
                  {upNextSub && (
                    <p className={`mt-0.5 text-xs font-medium ${ongoingClass ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-700 dark:text-cyan-300'}`}>
                      {upNextSub}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className={personal ? 'grid grid-cols-2 gap-3 lg:grid-cols-1' : 'grid gap-3'}>
              <div className="glass rounded-3xl p-5">
                <Users className="text-cyan-800 dark:text-cyan-300" />
                <p className="mt-5 text-3xl font-semibold">{regularCount}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">regular classes</p>
              </div>
              {personal && (
              <div className="glass rounded-3xl p-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-300" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-200">Retake</p>
                </div>
                <p className="mt-5 text-3xl font-semibold">{retakeCount}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {retakeCount === 1 ? 'session' : 'sessions'}{retakeCourses.length > 0 ? ` · ${retakeCourses.join(', ')}` : ''}
                </p>
              </div>
              )}
            </div>
          </section>

          <section className="glass mt-8 rounded-3xl p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <div className="mb-3 flex items-center gap-2 sm:mb-0">
              <Search className="text-cyan-800 dark:text-cyan-300" />
              <div>
                <p className="text-sm font-semibold">Your section</p>
                <p className="text-xs text-slate-500">Regular classes for {selectedSection}</p>
              </div>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor="section-select" className="sr-only">
                Select batch section
              </label>
              <select
                id="section-select"
                value={selectedSection}
                onChange={(event) => chooseSection(event.target.value)}
                className={`w-full appearance-none rounded-2xl glass-input px-4 py-3 pr-10 text-sm font-medium text-slate-900 outline-none ring-cyan-400 dark:text-slate-100 dark:ring-cyan-300 transition focus:ring-2 ${FOCUS_RING}`}
              >
                {SECTIONS.map((section) => (
                  <option key={section} value={section} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {section}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            </div>
          </section>

          {isNextWeek && (
            <p className="mt-5 text-xs font-medium text-slate-500 dark:text-slate-400">
              No classes today (Friday) — showing next week.
            </p>
          )}

          <nav aria-label="Select a day" className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-5">
            {DAYS.map((day, i) => {
              const isToday = isMounted && now !== null && day === getToday(now)
              const count = weekCounts[day]
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-current={isToday ? 'date' : undefined}
                  className={`relative min-w-[58px] rounded-full px-4 py-3 text-sm font-semibold transition ${FOCUS_RING} ${
                    selectedDay === day
                      ? 'glass glass-active text-slate-950'
                      : 'glass glass-hover text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block text-xs opacity-70">{FULL_DAYS[day].slice(0, 3)}</span>
                  <span className="block text-base tabular-nums">{weekDates ? weekDates[i].getDate() : '·'}</span>
                  {count > 0 && (
                    <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wide tabular-nums opacity-70">
                      {count} {count === 1 ? 'class' : 'classes'}
                    </span>
                  )}
                  {isToday && <span aria-label="Today" className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-current" />}
                </button>
              )
            })}
          </nav>

          <section className="mt-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{FULL_DAYS[selectedDay]} schedule</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {dayClasses.length
                    ? `${dayClasses.length} classes from your routine`
                    : sectionHasData
                    ? 'A clear day — no classes scheduled.'
                    : `No routine added for ${selectedSection} yet.`}
                </p>
              </div>
              {totalDurationMinutes > 0 && (
                <p className="shrink-0 text-right text-xs font-medium text-slate-500 sm:text-sm">
                  {totalDurationLabel}
                </p>
              )}
            </div>

            {!sectionHasData && (
              <div className="glass glass-dim mb-3 rounded-2xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                No regular routine has been added for {selectedSection} yet.{personal ? ' Only your personal sessions are shown.' : ''}
              </div>
            )}

            <div className="flex flex-col gap-3">
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
                      <div
                        className="break-stripes flex items-center justify-between rounded-2xl px-4 py-3 text-slate-600 dark:text-slate-400"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">Break Time</p>
                          <p className="mt-1 text-xs">
                            {previous.endTime} - {item.startTime} ({gapHours}h {gapMins}m)
                          </p>
                        </div>
                        <Coffee aria-hidden="true" />
                      </div>
                    )}
                    <article
                      className={`glass flex items-stretch gap-3 rounded-3xl p-4 transition sm:gap-5 sm:p-5 ${
                        ongoing
                          ? 'glass-now'
                          : inactive
                          ? 'glass-dim opacity-50 grayscale'
                          : 'glass-hover'
                      }`}
                    >
                      <div className="flex w-[58px] shrink-0 flex-col justify-center border-r border-slate-400/25 dark:border-white/10 pr-3 sm:w-[88px] sm:pr-5">
                        <span className="font-mono text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">{item.startTime}</span>
                        <span className="my-1 h-px w-4 bg-slate-600" />
                        <span className="font-mono text-xs tabular-nums text-slate-500">{item.endTime}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-base font-semibold sm:text-lg ${inactive ? 'line-through' : ''}`}>
                            {item.courseCode}
                          </h3>
                          {ongoing && (
                            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
                              Now
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              inactive
                                ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
                                : item.isRetake
                                ? 'bg-amber-300 text-amber-950'
                                : 'bg-cyan-400/20 text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200'
                            }`}
                          >
                            {inactive ? skippedLabel : item.isRetake ? 'Retake' : `Section ${item.section}`}
                          </span>
                          {item.subSection && (
                            <span className="rounded-full bg-white/50 px-2 py-0.5 dark:bg-white/10 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                              {item.subSection}
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 text-sm ${inactive ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.courseTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
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

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-400/25 dark:border-white/10 pt-5 text-xs text-slate-500">
            <span>Routine V3.1 · Effective 26 September 2026</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${liveStatus.dot} ${liveStatus.pulse ? 'animate-pulse' : ''}`} /> {liveStatus.label}
            </span>
          </footer>
        </div>
      </main>
    </>
  )
}

function formatCountdown(totalMinutes: number) {
  if (totalMinutes <= 0) return 'now'
  if (totalMinutes < 60) return `${totalMinutes}m`
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
}
