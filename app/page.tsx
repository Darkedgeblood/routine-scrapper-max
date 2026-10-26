'use client'

import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'

import {
  DAYS,
  FULL_DAYS,
  ROUTINE_DATA,
  SECTIONS,
} from '@/lib/routine-data'
import { useAuth } from '@/lib/auth'
import { parseDateKey, toDateKey, useReminders } from '@/lib/reminders'
import { AccountSheet } from '@/components/account-sheet'
import { ReminderSheet, type CourseOption } from '@/components/reminder-sheet'
import { FeatureCenterSheet } from '@/components/feature-center-sheet'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardOverview } from '@/components/dashboard-overview'
import { DashboardReminders } from '@/components/dashboard-reminders'
import { ClassSchedule } from '@/components/class-schedule'
import { DayTabBar } from '@/components/day-tab-bar'
import { DashboardFooter } from '@/components/dashboard-footer'
import { AppSplash } from '@/components/app-splash'
import { downloadRoutineCalendar } from '@/lib/calendar-export'
import { clearScheduledNotifications, requestNotificationPermission, sendTestNotification, syncScheduledNotifications } from '@/lib/notification-scheduler'
import { BANGLADESH_NATIONAL_HOLIDAYS, getBangladeshNationalHoliday } from '@/lib/bangladesh-holidays'
import { checkForScheduleChanges, dismissScheduleNotice, type ScheduleNotice } from '@/lib/schedule-changes'
import { monitorAppUpdates, startApkUpdate, type AppUpdate } from '@/lib/app-updates'
import { getBatch69MidtermExams, getUpcomingBatch69MidtermExams } from '@/lib/exam-routine'
import { usePersonalRoutine } from '@/hooks/use-personal-routine'
import { formatCountdown, getToday, getWeekDates, isInactive, type RoutineDay } from '@/lib/routine-view'

// iOS system blue — used only for functional accents (selection, live status).
const IOS_BLUE = 'text-[#007AFF] dark:text-[#0A84FF]'
type ThemeMode = 'light' | 'dark' | 'system'

export default function Page() {
  // tabDay updates instantly (it drives the sliding highlight); selectedDay follows in a
  // low-priority transition so re-rendering the class list never delays the highlight.
  const [tabDay, setTabDay] = useState<RoutineDay>('Sat')
  const [selectedDay, setSelectedDay] = useState<RoutineDay>('Sat')
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

  const openAccount = useCallback((reason?: string) => {
    setAccountReason(reason)
    setAccountOpen(true)
  }, [])

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
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')
  const [isMounted, setIsMounted] = useState(false)
  const [selectedSection, setSelectedSection] = useState('69_P')
  const {
    isOwner: personal,
    routine: personalClasses,
    skippedCourses,
    skippedLabs,
    status: personalRoutineStatus,
    retry: retryPersonalRoutine,
  } = usePersonalRoutine(auth.userId)

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
    const savedTheme = window.localStorage.getItem('routine-theme') as ThemeMode | null
    const savedDark = window.localStorage.getItem('routine-dark')
    const startTheme: ThemeMode = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : savedDark === '0' ? 'light' : 'dark'
    const startDark = startTheme === 'dark' || (startTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setThemeMode(startTheme)
    setDark(startDark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', startDark ? '#000000' : '#F2F2F7')

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

    // Keep launch branding brief so the routine appears immediately after startup.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fadeTimer = window.setTimeout(() => setIsSplashFading(true), reducedMotion ? 80 : 420)
    const exitTimer = window.setTimeout(() => setShowSplash(false), reducedMotion ? 100 : 670)

    return () => {
      window.clearTimeout(clockTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(exitTimer)
    }
  }, [])

  const chooseThemeMode = (mode: ThemeMode) => {
    const nextDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setThemeMode(mode)
    setDark(nextDark)
    window.localStorage.setItem('routine-theme', mode)
    window.localStorage.setItem('routine-dark', nextDark ? '1' : '0')
    // Keep the browser UI/status bar color in sync with the scene.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', nextDark ? '#000000' : '#F2F2F7')
  }

  useEffect(() => {
    if (themeMode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => {
      setDark(media.matches)
      window.localStorage.setItem('routine-dark', media.matches ? '1' : '0')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', media.matches ? '#000000' : '#F2F2F7')
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [themeMode])

  const selectDay = useCallback((day: RoutineDay) => {
    if (day === tabDay) return
    setTabDay(day) // highlight moves right away
    startTransition(() => setSelectedDay(day)) // the class list catches up without blocking it
    window.setTimeout(() => window.localStorage.setItem('routine-day', day), 0)
  }, [tabDay])

  const chooseSection = useCallback((section: string) => {
    if (!SECTIONS.includes(section)) return
    setSelectedSection(section)
    setLabGroup(window.localStorage.getItem(`routine-lab-group:${section}`) ?? 'all')
    window.localStorage.setItem('routine-section', section)
  }, [])

  const chooseLabGroup = useCallback((group: string) => {
    setLabGroup(group)
    window.localStorage.setItem(`routine-lab-group:${selectedSection}`, group)
  }, [selectedSection])

  const labGroups = useMemo(() => [...new Set(
    ROUTINE_DATA
      .filter((item) => item.section === selectedSection && item.subSection)
      .map((item) => item.subSection!.slice(-1))
  )].sort(), [selectedSection])

  const selectedSectionClasses = useMemo(
    () => ROUTINE_DATA.filter((item) => item.section === selectedSection),
    [selectedSection]
  )

  const enableNotifications = useCallback(async () => {
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
  }, [])

  const disableNotifications = useCallback(() => {
    window.localStorage.setItem('routine-notifications-enabled', '0')
    setNotificationsEnabled(false)
    setNotificationError(null)
    setNotificationStatus('Notifications are off.')
  }, [])

  const testNotification = useCallback(async () => {
    setNotificationError(null)
    try {
      await sendTestNotification()
      setNotificationStatus('Test alert scheduled for 5 seconds from now.')
    } catch {
      setNotificationError('Test alert could not be scheduled. Check your phone notification settings.')
    }
  }, [])

  const changeNotificationLead = useCallback((minutes: number) => {
    setNotificationLead(minutes)
    window.localStorage.setItem('routine-notification-lead', String(minutes))
  }, [])

  const dismissNotice = useCallback(() => {
    if (!scheduleNotice) return
    dismissScheduleNotice(scheduleNotice.id)
    setScheduleNotice(null)
  }, [scheduleNotice])

  const closeFeatures = useCallback(() => setFeaturesOpen(false), [])
  const closeReminders = useCallback(() => setSheetOpen(false), [])
  const closeAccount = useCallback(() => setAccountOpen(false), [])

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

  const weekAnchorKey = now ? toDateKey(getWeekDates(now)[0]) : null
  const weekDates = useMemo(
    () => weekAnchorKey ? getWeekDates(parseDateKey(weekAnchorKey)) : null,
    [weekAnchorKey]
  )
  const selectedDate = weekDates ? weekDates[DAYS.indexOf(selectedDay)] : null
  const selectedHoliday = getBangladeshNationalHoliday(selectedDate)
  const clockDateKey = now ? toDateKey(now) : null
  const selectedExams = useMemo(
    () => getBatch69MidtermExams(selectedDate ? toDateKey(selectedDate) : null, selectedSection),
    [selectedDate, selectedSection]
  )
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null
  const upcomingExams = useMemo(
    () => getUpcomingBatch69MidtermExams(clockDateKey, selectedDateKey, selectedSection),
    [clockDateKey, selectedDateKey, selectedSection]
  )
  const reminderNow = useMemo(() => clockDateKey ? parseDateKey(clockDateKey) : null, [clockDateKey])
  const todayDay = isMounted && now !== null ? getToday(now) : null

  const dayClasses = useMemo(
    () =>
      [...ROUTINE_DATA, ...personalClasses]
        .filter((item) => item.day === FULL_DAYS[selectedDay] && (item.section === selectedSection || item.isRetake))
        .sort((a, b) => a.startMinutes - b.startMinutes),
    [selectedDay, selectedSection, personalClasses]
  )
  const visibleDayClasses = useMemo(() => selectedHoliday ? [] : dayClasses, [selectedHoliday, dayClasses])
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
  }, [selectedSection, personalClasses])

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
  const exportCalendar = useCallback(
    (weeks: number) => downloadRoutineCalendar(selectedSectionClasses, selectedSection, weeks),
    [selectedSectionClasses, selectedSection]
  )

  const activeClasses = useMemo(
    () => visibleDayClasses.filter((item) => !isInactive(item, skippedCourses, skippedLabs, labGroup)),
    [visibleDayClasses, skippedCourses, skippedLabs, labGroup]
  )
  const totalDurationMinutes = useMemo(
    () => activeClasses.reduce((total, item) => total + item.endMinutes - item.startMinutes, 0),
    [activeClasses]
  )
  const regularCount = useMemo(() => activeClasses.filter((item) => !item.isRetake).length, [activeClasses])
  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1
  const dayReminders = useMemo(
    () => selectedDate ? pendingByDate[toDateKey(selectedDate)] ?? [] : [],
    [selectedDate, pendingByDate]
  )
  const dayDoneCount = useMemo(
    () => selectedDate ? reminders.filter((r) => r.done && r.date === toDateKey(selectedDate)).length : 0,
    [selectedDate, reminders]
  )
  const isViewingToday = isMounted && now !== null && selectedDay === getToday(now)
  // Friday has no tab; the tabs then show the coming week.
  const isNextWeek = isMounted && now !== null && getToday(now) === null
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
      {showSplash && <AppSplash fading={isSplashFading} />}

      {/* Main Routine App View */}
      <main className={dark ? 'dark ios-scene min-h-screen text-slate-900 dark:text-slate-100' : 'ios-scene min-h-screen text-slate-900'}>
        <div className="relative z-10 mx-auto min-h-screen max-w-3xl px-4 pb-32 pt-[calc(24px+env(safe-area-inset-top))] sm:px-6">

          <DashboardHeader
            auth={auth}
            sectionLabel={`CSE • Batch 69_${selectedSection.replace(/^69_/, '')}${labGroup !== 'all' ? labGroup : ''}`}
            pendingCount={pending.length}
            isMounted={isMounted}
            personal={personal}
            personalRoutineStatus={personalRoutineStatus}
            onRetryPersonalRoutine={() => void retryPersonalRoutine()}
            scheduleNotice={scheduleNotice}
            onDismissScheduleNotice={dismissNotice}
            appUpdate={appUpdate}
            onOpenReminders={() => auth.user
              ? setSheetOpen(true)
              : openAccount('Sign in with your university email to keep track of quizzes, assignments and presentations.')}
            onOpenFeatures={() => setFeaturesOpen(true)}
            onOpenAccount={() => openAccount()}
            onStartApkUpdate={(url) => { void startApkUpdate(url) }}
          />

          <DashboardOverview
            clockLabel={isMounted && now ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 AM'}
            dateLabel={isMounted && now ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading date…'}
            upNextLabel={upNextLabel}
            upNextDetail={upNextDetail}
            upNextSub={upNextSub}
            ongoing={!!ongoingClass}
            regularCount={regularCount}
            totalDurationMinutes={totalDurationMinutes}
          />

          <DashboardReminders
            isSignedIn={!!auth.user}
            dayReminders={dayReminders}
            dayDoneCount={dayDoneCount}
            isViewingToday={isViewingToday}
            now={reminderNow}
            onOpenAccount={openAccount}
            onToggle={toggleReminder}
          />

          <ClassSchedule
            selectedDay={selectedDay}
            tabDay={tabDay}
            onSelectDay={selectDay}
            selectedSection={selectedSection}
            isNextWeek={isNextWeek}
            sectionHasData={sectionHasData}
            personal={personal}
            selectedHoliday={selectedHoliday}
            midtermExams={selectedExams}
            upcomingMidtermExams={upcomingExams}
            visibleDayClasses={visibleDayClasses}
            skippedCourses={skippedCourses}
            skippedLabs={skippedLabs}
            labGroup={labGroup}
            ongoingClass={ongoingClass}
          />

          <DashboardFooter dot={liveStatus.dot} pulse={liveStatus.pulse} label={liveStatus.label} />
        </div>

        <DayTabBar
          tabDay={tabDay}
          onSelectDay={selectDay}
          weekDates={weekDates}
          weekCounts={weekCounts}
          pendingByDate={pendingByDate}
          todayDay={todayDay}
        />

        <AccountSheet
          open={accountOpen}
          onClose={closeAccount}
          auth={auth}
          reason={accountReason}
          themeMode={themeMode}
          onThemeModeChange={chooseThemeMode}
          section={selectedSection}
          onChooseSection={chooseSection}
        />

        <FeatureCenterSheet
          open={featuresOpen}
          onClose={closeFeatures}
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
          onExportCalendar={exportCalendar}
        />

        <ReminderSheet
          error={reminderError}
          open={sheetOpen}
          onClose={closeReminders}
          reminders={reminders}
          now={reminderNow}
          courses={courseOptions}
          onAdd={addReminder}
          onToggle={toggleReminder}
          onRemove={removeReminder}
        />
      </main>
    </>
  )
}

