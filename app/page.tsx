'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronRight, Coffee, MapPin, Moon, Search, Sun, Users, Zap } from 'lucide-react'
import { Archivo_Black } from 'next/font/google' // <-- ADD THIS

// Initialize Archivo Black (it only has a '400' weight)
const archivoBlack = Archivo_Black({ 
  weight: '400', 
  subsets: ['latin'] 
}) // <-- ADD THIS

type RoutineItem = {
// ... rest of your code stays the same
  id: string
  day: string
  startTime: string
  endTime: string
  courseCode: string
  courseTitle: string
  room: string
  teacher: string
  section: string
  subSection?: string | null
  startMinutes: number
  endMinutes: number
  isRetake: boolean
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const
const FULL_DAYS: Record<string, string> = {
  Sat: 'Saturday',
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
}
const SECTIONS = ['69_A', '69_B', '69_C', '69_D', '69_E', '69_F', '69_G', '69_H', '69_I', '69_J', '69_K', '69_L', '69_M', '69_N', '69_O', '69_P']

// The class routine everyone sees.
const ROUTINE_DATA: RoutineItem[] = [
  { id: 'sun-aol101', day: 'Sunday', startTime: '08:30 AM', endTime: '10:00 AM', startMinutes: 510, endMinutes: 600, courseCode: 'AOL101', courseTitle: 'Art of Living', section: '69_P', teacher: 'IEA', room: 'KT-217', isRetake: false, subSection: null },
  { id: 'sun-cse216', day: 'Sunday', startTime: '11:30 AM', endTime: '02:30 PM', startMinutes: 690, endMinutes: 870, courseCode: 'CSE216', courseTitle: 'Electronic Devices and Circuits Lab', section: '69_P', teacher: 'SRRS', room: 'SH-105 (E.C. & B.E. Lab)', isRetake: false, subSection: '69_P1' },
  { id: 'mon-cse221', day: 'Monday', startTime: '02:30 PM', endTime: '04:00 PM', startMinutes: 870, endMinutes: 960, courseCode: 'CSE221', courseTitle: 'Object Oriented Programming', section: '69_P', teacher: 'SRS', room: 'G1-027', isRetake: false, subSection: null },
  { id: 'mon-aol101', day: 'Monday', startTime: '04:00 PM', endTime: '05:30 PM', startMinutes: 960, endMinutes: 1050, courseCode: 'AOL101', courseTitle: 'Art of Living', section: '69_P', teacher: 'IEA', room: 'KT-224', isRetake: false, subSection: null },
  { id: 'tue-cse222', day: 'Tuesday', startTime: '11:30 AM', endTime: '02:30 PM', startMinutes: 690, endMinutes: 870, courseCode: 'CSE222', courseTitle: 'Object Oriented Programming Lab', section: '69_P', teacher: 'SRS', room: 'G1-013 (COM LAB)', isRetake: false, subSection: '69_P2' },
  { id: 'tue-cse221', day: 'Tuesday', startTime: '04:00 PM', endTime: '05:30 PM', startMinutes: 960, endMinutes: 1050, courseCode: 'CSE221', courseTitle: 'Object Oriented Programming', section: '69_P', teacher: 'SRS', room: 'KT-220', isRetake: false, subSection: null },
  { id: 'wed-cse222', day: 'Wednesday', startTime: '11:30 AM', endTime: '02:30 PM', startMinutes: 690, endMinutes: 870, courseCode: 'CSE222', courseTitle: 'Object Oriented Programming Lab', section: '69_P', teacher: 'SRS', room: 'G1-002 (COM LAB)', isRetake: false, subSection: '69_P1' },
  { id: 'wed-cse215', day: 'Wednesday', startTime: '04:00 PM', endTime: '05:30 PM', startMinutes: 960, endMinutes: 1050, courseCode: 'CSE215', courseTitle: 'Electronic Devices and Circuits', section: '69_P', teacher: 'SRRS', room: 'KT-306', isRetake: false, subSection: null },
  { id: 'thu-cse216', day: 'Thursday', startTime: '08:30 AM', endTime: '11:30 AM', startMinutes: 510, endMinutes: 690, courseCode: 'CSE216', courseTitle: 'Electronic Devices and Circuits Lab', section: '69_P', teacher: 'SRRS', room: 'KT-809 (E.C. & D.E. Lab)', isRetake: false, subSection: '69_P2' },
  { id: 'thu-cse215', day: 'Thursday', startTime: '11:30 AM', endTime: '01:00 PM', startMinutes: 690, endMinutes: 780, courseCode: 'CSE215', courseTitle: 'Electronic Devices and Circuits', section: '69_P', teacher: 'SRRS', room: 'KT-220', isRetake: false, subSection: null },
]

// Extra sessions that only show in personal mode (tap the logo 5 times to switch it on or off).
const PERSONAL_DATA: RoutineItem[] = [
  { id: 'sat-retake-mat211', day: 'Saturday', startTime: '11:30 AM', endTime: '01:00 PM', startMinutes: 690, endMinutes: 780, courseCode: 'MAT211', courseTitle: 'Engineering Mathematics', section: 'RE_B(3C)', teacher: 'NRM', room: 'KT-217', isRetake: true, subSection: null },
  { id: 'sun-retake-mat211', day: 'Sunday', startTime: '08:30 AM', endTime: '10:00 AM', startMinutes: 510, endMinutes: 600, courseCode: 'MAT211', courseTitle: 'Engineering Mathematics', section: 'RE_B(3C)', teacher: 'NRM', room: 'ANX1-208', isRetake: true, subSection: null },
]

// Personal settings, applied only in personal mode.
const MY_SKIPPED_COURSES = ['AOL101'] // courses I didn't take
const MY_SKIPPED_LABS = ['69_P2'] // lab sub-sections I'm not in

// Returns today's key, or null on a day with no classes (Friday).
function getToday(date = new Date()): (typeof DAYS)[number] | null {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
  return DAYS.includes(day as (typeof DAYS)[number]) ? (day as (typeof DAYS)[number]) : null
}

// Dates for the Sat–Thu week shown in the day tabs (on Friday it shows the coming week).
function getWeekDates(todayKey: string) {
  if (!todayKey) return null
  const start = new Date(todayKey)
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
    setNow(new Date())
    const today = getToday() ?? 'Sat'
    setSelectedDay(today)
    window.localStorage.setItem('routine-day', today)

    const savedSection = window.localStorage.getItem('routine-section')
    if (savedSection && SECTIONS.includes(savedSection)) setSelectedSection(savedSection)
    if (window.localStorage.getItem('routine-personal') === '1') setPersonal(true)

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

  const sectionHasData = useMemo(
    () => ROUTINE_DATA.some((item) => item.section === selectedSection),
    [selectedSection]
  )

  const totalDurationMinutes = dayClasses
    .filter((item) => !isInactive(item, personal))
    .reduce((total, item) => total + item.endMinutes - item.startMinutes, 0)
  const totalDurationLabel = `Total: ${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
  const regularCount = dayClasses.filter((item) => !item.isRetake && !isSkippedCourse(item, personal)).length
  const retakeCount = dayClasses.filter((item) => item.isRetake).length
  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1
  const todayKey = now ? now.toDateString() : ''
  const weekDates = useMemo(() => getWeekDates(todayKey), [todayKey])
  const selectedDate = weekDates ? weekDates[DAYS.indexOf(selectedDay)] : null
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : ''
  const isViewingToday = isMounted && now !== null && selectedDay === getToday(now)
  const activeClasses = dayClasses.filter((item) => !isInactive(item, personal))
  // Only compare against the clock when the selected day is today; otherwise show the day's first class.
  const upcomingClass = isViewingToday
    ? activeClasses.find((item) => item.startMinutes > currentMinutes)
    : activeClasses[0]
  const upNextLabel = isViewingToday ? 'Next up' : 'First class'
  const upNextEmpty = isViewingToday && activeClasses.length > 0 ? 'No more classes' : 'No classes'

  return (
    <>
      {/* Launch Splash Screen Overlay */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] select-none ${
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
              <div
                onClick={handleLogoTap}
                className="flex size-10 cursor-default select-none items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
              >
                <CalendarDays />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Routine</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">CSE · Batch 69{personal ? ' · Personal' : ''}</p>
              </div>
            </div>
            <button
              aria-label="Toggle dark mode"
              onClick={() => setDark(!dark)}
              className="glass glass-hover flex size-10 items-center justify-center rounded-full text-slate-600 transition dark:text-slate-300"
            >
              {dark ? <Sun /> : <Moon />}
            </button>
          </header>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="glass glass-hero rounded-[2rem] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">{FULL_DAYS[selectedDay]}{selectedDateLabel ? ` · ${selectedDateLabel}` : ''}</p>
                  <h1 className={`mt-2 text-3xl tracking-tight sm:text-4xl ${archivoBlack.className}`}>
                    Your classes, <span className="text-cyan-700 dark:text-cyan-300">at a glance.</span>
                  </h1>
                </div>
                <Zap className="mt-1 text-cyan-700 dark:text-cyan-300" />
              </div>
              <div className="mt-8 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                    {isMounted && now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 AM'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {isMounted && now ? now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading date…'}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{upNextLabel}</p>
                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                    {upcomingClass ? `${upcomingClass.courseCode} · ${upcomingClass.startTime} - ${upcomingClass.endTime}` : upNextEmpty}
                  </p>
                </div>
              </div>
            </div>
            <div className={personal ? 'grid grid-cols-2 gap-3 lg:grid-cols-1' : 'grid gap-3'}>
              <div className="glass rounded-3xl p-5">
                <Users className="text-cyan-700 dark:text-cyan-300" />
                <p className="mt-5 text-3xl font-semibold">{regularCount}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">regular classes</p>
              </div>
              {personal && (
              <div className="glass glass-amber rounded-3xl p-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-300" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-200">Retake</p>
                </div>
                <p className="mt-5 text-3xl font-semibold">{retakeCount}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">MAT211 session</p>
              </div>
              )}
            </div>
          </section>

          <section className="glass mt-8 rounded-3xl p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <div className="mb-3 flex items-center gap-2 sm:mb-0">
              <Search className="text-cyan-700 dark:text-cyan-300" />
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
                className="w-full appearance-none rounded-2xl glass-input px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-cyan-400 dark:text-slate-100 dark:ring-cyan-300 transition focus:ring-2"
              >
                {SECTIONS.map((section) => (
                  <option key={section} value={section} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <nav aria-label="Select a day" className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {DAYS.map((day, i) => {
              const isToday = isMounted && now !== null && day === getToday(now)
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  aria-current={isToday ? 'date' : undefined}
                  className={`relative min-w-[58px] rounded-full px-4 py-3 text-sm font-semibold transition ${
                    selectedDay === day
                      ? 'glass glass-active text-slate-950'
                      : 'glass glass-hover text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block text-xs opacity-70">{FULL_DAYS[day].slice(0, 3)}</span>
                  <span className="block text-base tabular-nums">{weekDates ? weekDates[i].getDate() : '·'}</span>
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
              <div className="glass glass-amber mb-3 rounded-2xl px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                No regular routine has been added for {selectedSection} yet.{personal ? ' Only your personal sessions are shown.' : ''}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {dayClasses.map((item, index) => {
                const previous = dayClasses[index - 1]
                const gap = previous ? item.startMinutes - previous.endMinutes : 0
                const durationHours = Math.floor(gap / 60)
                const durationMins = gap % 60
                const inactive = isInactive(item, personal)
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
                            {previous.endTime} - {item.startTime} ({durationHours}h {durationMins}m)
                          </p>
                        </div>
                        <Coffee aria-hidden="true" />
                      </div>
                    )}
                    <article
                      key={item.id}
                      className={`glass group flex items-stretch gap-3 rounded-3xl p-4 transition hover:-translate-y-0.5 sm:gap-5 sm:p-5 ${
                        inactive
                          ? 'glass-dim opacity-50 grayscale'
                          : item.isRetake
                          ? 'glass-amber'
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
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5" /> {item.teacher}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="my-auto hidden text-slate-600 transition group-hover:translate-x-1 sm:block" />
                    </article>
                  </Fragment>
                )
              })}
            </div>
          </section>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-400/25 dark:border-white/10 pt-5 text-xs text-slate-500">
            <span>Routine V3.1 · Effective 26 September 2026</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Live schedule
            </span>
          </footer>
        </div>
      </main>
    </>
  )
}
