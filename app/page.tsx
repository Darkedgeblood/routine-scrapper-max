'use client'

import { Fragment, startTransition, useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, CircleAlert, Clock, Coffee, Download, MapPin, Plus, Settings2, Users, X } from 'lucide-react'

import {
  DAYS,
  FULL_DAYS,
  ROUTINE_DATA,
  SECTIONS,
  TEACHERS,
  type RoutineItem,
} from '@/lib/routine-data'
import { useAuth } from '@/lib/auth'
import { toDateKey, useReminders } from '@/lib/reminders'
import { AccountSheet, Avatar } from '@/components/account-sheet'
import { ReminderRow, ReminderSheet, TYPE_META, type CourseOption } from '@/components/reminder-sheet'
import { FeatureCenterSheet } from '@/components/feature-center-sheet'
import { downloadRoutineCalendar } from '@/lib/calendar-export'
import { clearScheduledNotifications, requestNotificationPermission, sendTestNotification, syncScheduledNotifications } from '@/lib/notification-scheduler'
import { BANGLADESH_NATIONAL_HOLIDAYS, getBangladeshNationalHoliday } from '@/lib/bangladesh-holidays'
import { checkForScheduleChanges, dismissScheduleNotice, type ScheduleNotice } from '@/lib/schedule-changes'
import { monitorAppUpdates, startApkUpdate, type AppUpdate } from '@/lib/app-updates'
import { supabase } from '@/lib/supabase'

const PERSONAL_OWNER_EMAIL = '252-15-596@diu.edu.bd'

type PersonalRoutine = {
  routine: RoutineItem[]
  skipped_courses: string[]
  skipped_labs: string[]
}

const EMPTY_ROUTINE: RoutineItem[] = []
const EMPTY_LIST: string[] = []

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

function isSkippedCourse(item: RoutineItem, skippedCourses: string[]) {
  return skippedCourses.includes(item.courseCode)
}

// Classes outside the selected lab group stay visible but are dimmed and excluded from totals.
function isOtherLabGroup(item: RoutineItem, group: string) {
  return !!item.subSection && group !== 'all' && item.subSection.slice(-1) !== group
}

function isInactive(item: RoutineItem, skippedCourses: string[], skippedLabs: string[], group: string) {
  return (
    isSkippedCourse(item, skippedCourses) ||
    (!!item.subSection && skippedLabs.includes(item.subSection)) ||
    isOtherLabGroup(item, group)
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
  // tabDay updates instantly (it drives the sliding highlight); selectedDay follows in a
  // low-priority transition so re-rendering the class list never delays the highlight.
  const [tabDay, setTabDay] = useState<(typeof DAYS)[number]>('Sat')
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS)[number]>('Sat')
  const [sheetOpen, setSheetOpen] = useState(false)
  const auth = useAuth()
  const { reminders, pending, error: reminderError, add: addReminder, toggle: toggleReminder, remove: removeReminder } = useReminders(auth.userId)
  const [accountOpen, setAccountOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [labGroup, setLabGroup] = useState('all')
  const [scheduleNotice, setScheduleNotice] = useState<ScheduleNotice | null>(null)
  const [appUpdate, setAppUpdate] = useState<AppUpdate | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationLead, setNotificationLead] = useState(10)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null)
  const [accountReason, setAccountReason] = useState<string | undefined>(undefined)

  const openAccount = (reason?: string) => {
    setAccountReason(reason)
    setAccountOpen(true)
  }

  // A password-reset email link opens the app with a recovery session: show the new-password form.
  useEffect(() => {
    if (auth.recovery) setAccountOpen(true)
  }, [auth.recovery])

  // Reminders belong to the account: close their sheet when signing out.
  useEffect(() => {
    if (!auth.user) setSheetOpen(false)
  }, [auth.user])
  const [now, setNow] = useState<Date | null>(null)
  const [dark, setDark] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedSection, setSelectedSection] = useState('69_P')
  const [personalRoutine, setPersonalRoutine] = useState<PersonalRoutine | null>(null)
  const [personalRoutineStatus, setPersonalRoutineStatus] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle')
  const [personalRoutineRetry, setPersonalRoutineRetry] = useState(0)
  const personal = auth.email?.trim().toLowerCase() === PERSONAL_OWNER_EMAIL
  const personalClasses = personal ? personalRoutine?.routine ?? EMPTY_ROUTINE : EMPTY_ROUTINE
  const skippedCourses = personal ? personalRoutine?.skipped_courses ?? EMPTY_LIST : EMPTY_LIST
  const skippedLabs = personal ? personalRoutine?.skipped_labs ?? EMPTY_LIST : EMPTY_LIST

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashFading, setIsSplashFading] = useState(false)

  useEffect(() => {
    const today = getToday() ?? 'Sat'

    // Restore the last-viewed day (falls back to today).
    const savedDay = window.localStorage.getItem('routine-day')
    const initialDay = savedDay && (DAYS as readonly string[]).includes(savedDay) ? (savedDay as (typeof DAYS)[number]) : today
    setSelectedDay(initialDay)
    setTabDay(initialDay)

    // Restore dark mode (defaults to dark).
    const savedDark = window.localStorage.getItem('routine-dark')
    const startDark = savedDark ? savedDark === '1' : true
    setDark(startDark)

    const savedSection = window.localStorage.getItem('routine-section')
    const initialSection = savedSection && SECTIONS.includes(savedSection) ? savedSection : '69_P'
    setSelectedSection(initialSection)
    setLabGroup(window.localStorage.getItem(`routine-lab-group:${initialSection}`) ?? 'all')
    setNotificationsEnabled(window.localStorage.getItem('routine-notifications-enabled') === '1')
    const savedLead = Number(window.localStorage.getItem('routine-notification-lead'))
    if ([5, 10, 15, 30].includes(savedLead)) setNotificationLead(savedLead)
    setScheduleNotice(checkForScheduleChanges(ROUTINE_DATA))
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

  // The owner-only data is fetched from Supabase; RLS is the access boundary.
  // Clearing before each lookup also prevents a previous account's data lingering after sign-out.
  useEffect(() => {
    let active = true
    setPersonalRoutine(null)
    if (!supabase || auth.email?.trim().toLowerCase() !== PERSONAL_OWNER_EMAIL) {
      setPersonalRoutineStatus('idle')
      return () => { active = false }
    }

    setPersonalRoutineStatus('loading')
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('personal_routines')
          .select('routine, skipped_courses, skipped_labs')
          .eq('owner_email', PERSONAL_OWNER_EMAIL)
          .maybeSingle()
        if (!active) return
        if (error) {
          console.error('Could not load personal routine', error)
          setPersonalRoutineStatus('error')
          return
        }
        if (!data) {
          setPersonalRoutineStatus('missing')
          return
        }
        if (
          data && Array.isArray(data.routine) &&
          Array.isArray(data.skipped_courses) && Array.isArray(data.skipped_labs)
        ) {
          setPersonalRoutine(data as PersonalRoutine)
          setPersonalRoutineStatus('ready')
        } else {
          setPersonalRoutineStatus('error')
        }
      } catch (error) {
        if (active) {
          console.error('Could not load personal routine', error)
          setPersonalRoutineStatus('error')
        }
      }
    })()

    return () => { active = false }
  }, [auth.email, personalRoutineRetry])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    window.localStorage.setItem('routine-dark', next ? '1' : '0')
    // Keep the browser UI/status bar color in sync with the scene.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#000000' : '#F2F2F7')
  }

  const selectDay = (day: (typeof DAYS)[number]) => {
    if (day === tabDay) return
    setTabDay(day) // highlight moves right away
    startTransition(() => setSelectedDay(day)) // the class list catches up without blocking it
    window.setTimeout(() => window.localStorage.setItem('routine-day', day), 0)
  }

  const chooseSection = (section: string) => {
    if (!SECTIONS.includes(section)) return
    setSelectedSection(section)
    setLabGroup(window.localStorage.getItem(`routine-lab-group:${section}`) ?? 'all')
    window.localStorage.setItem('routine-section', section)
  }

  const chooseLabGroup = (group: string) => {
    setLabGroup(group)
    window.localStorage.setItem(`routine-lab-group:${selectedSection}`, group)
  }

  const labGroups = useMemo(() => [...new Set(
    ROUTINE_DATA
      .filter((item) => item.section === selectedSection && item.subSection)
      .map((item) => item.subSection!.slice(-1))
  )].sort(), [selectedSection])

  const selectedSectionClasses = useMemo(
    () => ROUTINE_DATA.filter((item) => item.section === selectedSection),
    [selectedSection]
  )

  const enableNotifications = async () => {
    setNotificationError(null)
    setNotificationStatus(null)
    try {
      const granted = await requestNotificationPermission()
      if (!granted) {
        setNotificationError('Notifications are blocked. Allow them for Routine Scrapper Max in your phone settings, then try again.')
        return
      }
      window.localStorage.setItem('routine-notifications-enabled', '1')
      setNotificationsEnabled(true)
      setNotificationStatus('Permission granted. Scheduling your upcoming alerts…')
    } catch (error) {
      const reason = error instanceof Error && error.message ? error.message : 'Android could not check notification permission.'
      setNotificationError(`Could not enable alerts: ${reason} Check notification permission in your phone settings and try again.`)
    }
  }

  const disableNotifications = () => {
    window.localStorage.setItem('routine-notifications-enabled', '0')
    setNotificationsEnabled(false)
    setNotificationError(null)
    setNotificationStatus('Notifications are off.')
  }

  const testNotification = async () => {
    setNotificationError(null)
    try {
      await sendTestNotification()
      setNotificationStatus('Test alert scheduled for 5 seconds from now.')
    } catch {
      setNotificationError('Test alert could not be scheduled. Check your phone notification settings.')
    }
  }

  const changeNotificationLead = (minutes: number) => {
    setNotificationLead(minutes)
    window.localStorage.setItem('routine-notification-lead', String(minutes))
  }

  const dismissNotice = () => {
    if (!scheduleNotice) return
    dismissScheduleNotice(scheduleNotice.id)
    setScheduleNotice(null)
  }

  useEffect(() => {
    if (!isMounted) return
    let cancelled = false
    void syncScheduledNotifications({
      enabled: notificationsEnabled,
      classes: selectedSectionClasses,
      reminders: reminders.filter((item) => !item.done),
      leadMinutes: notificationLead,
      holidayDates: BANGLADESH_NATIONAL_HOLIDAYS.map((holiday) => holiday.date),
    }).then((count) => {
      if (!cancelled && notificationsEnabled) {
        setNotificationStatus(count > 0 ? `${count} upcoming alerts scheduled on this device.` : 'No upcoming alerts need scheduling yet.')
      }
    }).catch(() => {
      if (!cancelled) setNotificationError('Could not schedule alerts. Check phone notification settings and try again.')
    })
    return () => { cancelled = true }
  }, [isMounted, notificationsEnabled, selectedSectionClasses, reminders, notificationLead])

  useEffect(() => () => { void clearScheduledNotifications() }, [])

  useEffect(() => monitorAppUpdates(setAppUpdate), [])

  const weekDates = useMemo(() => (now ? getWeekDates(now) : null), [now])
  const selectedDate = weekDates ? weekDates[DAYS.indexOf(selectedDay)] : null
  const selectedHoliday = getBangladeshNationalHoliday(selectedDate)

  const dayClasses = useMemo(
    () =>
      [...ROUTINE_DATA, ...personalClasses]
        .filter((item) => item.day === FULL_DAYS[selectedDay] && (item.section === selectedSection || item.isRetake))
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [selectedDay, selectedSection, personalClasses]
  )
  const visibleDayClasses = selectedHoliday ? [] : dayClasses

  // How many active classes each day of the week has (shown under each day tab).
  const weekCounts = useMemo(() => {
    const source = [...ROUTINE_DATA, ...personalClasses]
    const counts = {} as Record<(typeof DAYS)[number], number>
    for (const day of DAYS) {
      const date = weekDates?.[DAYS.indexOf(day)]
      if (date && getBangladeshNationalHoliday(date)) {
        counts[day] = 0
        continue
      }
      counts[day] = source.filter(
        (item) =>
          item.day === FULL_DAYS[day] &&
          (item.section === selectedSection || item.isRetake) &&
          !isInactive(item, skippedCourses, skippedLabs, labGroup)
      ).length
    }
    return counts
  }, [selectedSection, personalClasses, skippedCourses, skippedLabs, labGroup, weekDates])

  // Courses offered in the reminder form: this section's classes plus retakes (and personal sessions).
  const courseOptions = useMemo<CourseOption[]>(() => {
    const source = [...ROUTINE_DATA, ...personalClasses]
    const seen = new Map<string, string>()
    for (const item of source) {
      if ((item.section === selectedSection || item.isRetake) && !seen.has(item.courseCode)) {
        seen.set(item.courseCode, item.courseTitle.replace(/ Lab$/, ''))
      }
    }
    return [...seen].map(([code, title]) => ({ code, title })).sort((a, b) => a.code.localeCompare(b.code))
  }, [selectedSection, personalClasses, labGroup])

  // Pending reminders grouped by calendar date (for the day card and the red dots on the tab bar).
  const pendingByDate = useMemo(() => {
    const map: Record<string, typeof pending> = {}
    for (const r of pending) (map[r.date] ??= []).push(r)
    return map
  }, [pending])

  const sectionHasData = useMemo(
    () => ROUTINE_DATA.some((item) => item.section === selectedSection),
    [selectedSection]
  )

  const totalDurationMinutes = visibleDayClasses
    .filter((item) => !isInactive(item, skippedCourses, skippedLabs, labGroup))
    .reduce((total, item) => total + item.endMinutes - item.startMinutes, 0)
  const totalDurationLabel = `Total: ${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
  const regularCount = visibleDayClasses.filter((item) => !item.isRetake && !isInactive(item, skippedCourses, skippedLabs, labGroup)).length
  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    : ''
  const dayReminders = selectedDate ? pendingByDate[toDateKey(selectedDate)] ?? [] : []
  const dayDoneCount = selectedDate
    ? reminders.filter((r) => r.done && r.date === toDateKey(selectedDate)).length
    : 0
  const isViewingToday = isMounted && now !== null && selectedDay === getToday(now)
  // Friday has no tab; the tabs then show the coming week.
  const isNextWeek = isMounted && now !== null && getToday(now) === null
  const activeClasses = visibleDayClasses.filter((item) => !isInactive(item, skippedCourses, skippedLabs, labGroup))
  const ongoingClass = isViewingToday
    ? activeClasses.find((item) => item.startMinutes <= currentMinutes && currentMinutes < item.endMinutes)
    : undefined
  // Only compare against the clock when the selected day is today; otherwise show the day's first class.
  const upcomingClass = isViewingToday
    ? activeClasses.find((item) => item.startMinutes > currentMinutes)
    : activeClasses[0]
  const upNextLabel = selectedHoliday ? 'National holiday' : isViewingToday ? 'Next up' : 'First class'
  const upNextEmpty = isViewingToday && activeClasses.length > 0 ? 'No more classes' : 'No classes'

  const upNextDetail = selectedHoliday
    ? `${selectedHoliday.name} Holiday`
    : upcomingClass
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
    : selectedHoliday
    ? { dot: 'bg-slate-400', label: `${selectedHoliday.name} holiday`, pulse: false }
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
          <header className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="truncate whitespace-nowrap text-[26px] font-bold leading-none tracking-tight sm:text-[32px]">
                Routine
              </h1>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                {`CSE • Batch 69_${selectedSection.replace(/^69_/, '')}${labGroup !== 'all' ? labGroup : ''}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() =>
                  auth.user
                    ? setSheetOpen(true)
                    : openAccount('Sign in with your university email to keep track of quizzes, assignments and presentations.')
                }
                aria-label={
                  isMounted && pending.length > 0
                    ? `Reminders, ${pending.length} pending`
                    : 'Add a quiz, assignment or presentation'
                }
                className={`panel relative flex size-10 items-center justify-center rounded-full text-slate-600 transition dark:text-slate-300 sm:size-11 ${FOCUS_RING}`}
              >
                <Plus className="size-5" />
                {isMounted && pending.length > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#FF3B30] px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-[#f2f2f7] dark:ring-black"
                  >
                    {pending.length > 99 ? '99+' : pending.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFeaturesOpen(true)}
                aria-label="Routine settings and tools"
                className={`panel flex size-10 items-center justify-center rounded-full text-slate-600 transition dark:text-slate-300 sm:size-11 ${FOCUS_RING}`}
              >
                <Settings2 className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => openAccount()}
                aria-label={auth.user ? 'Your profile' : 'Sign in'}
                className={`panel flex size-10 items-center justify-center overflow-hidden rounded-full text-slate-600 transition dark:text-slate-300 sm:size-11 ${FOCUS_RING}`}
              >
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
            <div
              role={personalRoutineStatus === 'error' || personalRoutineStatus === 'missing' ? 'alert' : 'status'}
              className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#FF9F0A]/20 bg-[#FF9F0A]/[0.08] px-3 py-2 text-[12px] text-slate-600 dark:text-slate-300"
            >
              <span>
                {personalRoutineStatus === 'loading'
                  ? 'Loading your private retake routine…'
                  : personalRoutineStatus === 'missing'
                    ? 'Your account is signed in, but no private retake routine is set up yet.'
                    : 'Could not load your private retake routine. Check your connection and try again.'}
              </span>
              {(personalRoutineStatus === 'error' || personalRoutineStatus === 'missing') && (
                <button
                  type="button"
                  onClick={() => setPersonalRoutineRetry((attempt) => attempt + 1)}
                  className={`shrink-0 font-semibold text-[#007AFF] dark:text-[#0A84FF] ${FOCUS_RING}`}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {scheduleNotice && (
            <section role="status" className="panel mt-3 flex items-start gap-2.5 rounded-2xl border border-[#007AFF]/20 p-3 dark:border-[#0A84FF]/20">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
              <button type="button" onClick={() => setFeaturesOpen(true)} className={`min-w-0 flex-1 text-left ${FOCUS_RING}`}>
                <span className="block text-[13px] font-semibold">{scheduleNotice.title}</span>
                <span className="mt-0.5 block truncate text-[12px] text-slate-500 dark:text-slate-400">{scheduleNotice.lines[0]}</span>
              </button>
              <button type="button" onClick={dismissNotice} aria-label="Dismiss routine update" className={`flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 ${FOCUS_RING}`}>
                <X className="size-4" />
              </button>
            </section>
          )}

          {appUpdate && (
            <section role="status" className="panel mt-3 flex items-center gap-3 rounded-2xl border border-[#007AFF]/20 p-3 dark:border-[#0A84FF]/20">
              <Download className="size-5 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">
                  {appUpdate.critical ? 'Important app update available' : 'App update available'}
                </p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Tap to download version {appUpdate.build}.</p>
              </div>
              <button
                type="button"
                onClick={() => void startApkUpdate(appUpdate.apkUrl)}
                className={`shrink-0 rounded-full bg-[#007AFF] px-3 py-2 text-[12px] font-semibold text-white dark:bg-[#0A84FF] ${FOCUS_RING}`}
              >
                Update
              </button>
            </section>
          )}

          {/* Compact live status card */}
          <section className="panel mt-5 rounded-3xl p-4 sm:mt-6 sm:p-5">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p role="timer" aria-live="off" className="text-[38px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
                  {isMounted && now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 AM'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isMounted && now ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading date…'}
                </p>
              </div>
              <div className="mt-5 min-w-0 border-t border-slate-200 pt-3 dark:border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{upNextLabel}</p>
                <p className="mt-1 break-words text-[17px] font-semibold leading-snug">{upNextDetail}</p>
                {upNextSub && (
                  <p className={`mt-0.5 text-[13px] font-medium ${ongoingClass ? 'text-[#30D158]' : IOS_BLUE}`}>
                    {upNextSub}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Today at a glance */}
          <section className="mt-3 grid grid-cols-2 gap-3">
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

          {/* Quizzes, assignments & presentations for the selected day */}
          <section className="panel mt-3 rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold">Quiz · Assignment · Presentation</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{isViewingToday ? 'Today' : selectedDateLabel}</p>
            </div>
            {!auth.user ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[14px] text-slate-400 dark:text-slate-500">Sign in to track quizzes, assignments and presentations.</p>
                <button
                  type="button"
                  onClick={() => openAccount()}
                  className={`ios-active shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold ${FOCUS_RING}`}
                >
                  Sign in
                </button>
              </div>
            ) : dayReminders.length > 0 && now ? (
              <div className="mt-1 divide-y divide-slate-200 dark:divide-white/10">
                {dayReminders.map((r) => (
                  <ReminderRow key={r.id} reminder={r} now={now} onToggle={toggleReminder} showDate={false} />
                ))}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3 text-slate-400 dark:text-slate-500">
                <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                  {(['quiz', 'assignment', 'presentation'] as const).map((t) => {
                    const Icon = TYPE_META[t].Icon
                    return <Icon key={t} className="size-4" />
                  })}
                </span>
                <p className="text-[14px]">
                  {dayDoneCount > 0
                    ? `All done ${isViewingToday ? 'today' : 'for this day'}.`
                    : `No presentation, assignment or quiz ${isViewingToday ? 'today' : 'this day'}.`}
                </p>
              </div>
            )}
          </section>

          {/* Schedule (iOS inset grouped list) */}
          <section className="mt-7">
            <div className="mb-3 flex items-end justify-between gap-4 px-1">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight">{FULL_DAYS[selectedDay]}</h2>
                <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                  {selectedHoliday
                    ? 'National holiday — no classes scheduled.'
                    : visibleDayClasses.length
                    ? `${visibleDayClasses.length} classes from your routine`
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

            {!selectedHoliday && !sectionHasData && (
              <div className="panel panel-dim mb-3 rounded-2xl px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">
                No regular routine has been added for {selectedSection} yet.{personal ? ' Only your personal sessions are shown.' : ''}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
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
                const inactiveLabel = isSkippedCourse(item, skippedCourses) ? 'Not registered' : isOtherLabGroup(item, labGroup) ? 'Other group' : inactive ? `${item.subSection} Lab (skipped)` : ''

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
                      <div className="flex w-[84px] shrink-0 flex-col justify-center border-r border-slate-200 pr-3 dark:border-white/10 sm:w-[96px] sm:pr-4">
                        <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums sm:text-[14px]">{item.startTime}</span>
                        <span className="my-1 h-px w-3 bg-slate-300 dark:bg-slate-600" />
                        <span className="whitespace-nowrap text-[11px] tabular-nums text-slate-400 dark:text-slate-500 sm:text-[12px]">{item.endTime}</span>
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
                            {inactive ? inactiveLabel : item.isRetake ? 'Retake' : `Section ${item.section}`}
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
            <span>Routine V4.1 · Effective 3 October 2026</span>
          </footer>
        </div>

        {/* iOS-style floating day tab bar */}
        <nav aria-label="Select a day" className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-3xl px-4 pb-4">
            <div className="ios-tabbar relative flex rounded-3xl px-2 py-2">
              {/* Sliding highlight: moves with a GPU transform instead of re-painting each tab */}
              <span
                aria-hidden="true"
                className="ios-tab-indicator pointer-events-none absolute bottom-2 left-2 top-2 rounded-2xl bg-black/5 dark:bg-white/10"
                style={{
                  width: `calc((100% - 16px) / ${DAYS.length})`,
                  transform: `translateX(${DAYS.indexOf(tabDay) * 100}%)`,
                }}
              />
              {DAYS.map((day, i) => {
                const isToday = isMounted && now !== null && day === getToday(now)
                const active = tabDay === day
                const count = weekCounts[day]
                const hasDue = weekDates ? (pendingByDate[toDateKey(weekDates[i])]?.length ?? 0) > 0 : false
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={active}
                    className={`relative z-10 flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 ${FOCUS_RING}`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide transition-colors duration-200 ${active ? IOS_BLUE : 'text-slate-400 dark:text-slate-500'}`}>
                      {day}
                    </span>
                    <span className={`text-[14px] font-bold tabular-nums transition-colors duration-200 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {weekDates ? weekDates[i].getDate() : '·'}
                    </span>
                    <span className="text-[9px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                      {count > 0 ? `${count} class${count === 1 ? '' : 'es'}` : ' '}
                    </span>
                    {isToday && (
                      <span aria-label="Today" className={`mt-0.5 size-1 rounded-full ${IOS_BLUE}`} />
                    )}
                    {hasDue && (
                      <span aria-label="Has a reminder due" className="absolute right-2 top-1.5 size-1.5 rounded-full bg-[#FF3B30]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        <AccountSheet
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          auth={auth}
          reason={accountReason}
          dark={dark}
          onToggleDark={toggleDark}
          section={selectedSection}
          onChooseSection={chooseSection}
        />

        <FeatureCenterSheet
          open={featuresOpen}
          onClose={() => setFeaturesOpen(false)}
          section={selectedSection}
          labGroup={labGroup}
          labGroups={labGroups}
          onLabGroupChange={chooseLabGroup}
          scheduleNotice={scheduleNotice}
          onDismissScheduleNotice={dismissNotice}
          classes={selectedSectionClasses}
          notificationsEnabled={notificationsEnabled}
          notificationLead={notificationLead}
          onEnableNotifications={enableNotifications}
          onDisableNotifications={disableNotifications}
          onTestNotification={testNotification}
          onLeadChange={changeNotificationLead}
          notificationError={notificationError}
          notificationStatus={notificationStatus}
          onExportCalendar={(weeks) => downloadRoutineCalendar(selectedSectionClasses, selectedSection, weeks)}
        />

        <ReminderSheet
          error={reminderError}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          reminders={reminders}
          now={now}
          courses={courseOptions}
          onAdd={addReminder}
          onToggle={toggleReminder}
          onRemove={removeReminder}
        />
      </main>
    </>
  )
}

