'use client'

import { useEffect, useState } from 'react'
import { Bell, CalendarDays, ChevronDown, CircleAlert, MessageSquareWarning, Share2, X } from 'lucide-react'

import type { ScheduleNotice } from '@/lib/schedule-changes'
import type { RoutineItem } from '@/lib/routine-data'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:focus-visible:ring-[#0A84FF]/60'
const FIELD = 'w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-[14px] outline-none dark:border-white/10'

export function FeatureCenterSheet({
  open,
  onClose,
  section,
  labGroup,
  labGroups,
  onLabGroupChange,
  scheduleNotice,
  onDismissScheduleNotice,
  classes,
  notificationsEnabled,
  notificationLead,
  onEnableNotifications,
  onDisableNotifications,
  onTestNotification,
  onLeadChange,
  notificationError,
  notificationStatus,
  onExportCalendar,
}: {
  open: boolean
  onClose: () => void
  section: string
  labGroup: string
  labGroups: string[]
  onLabGroupChange: (value: string) => void
  scheduleNotice: ScheduleNotice | null
  onDismissScheduleNotice: () => void
  classes: RoutineItem[]
  notificationsEnabled: boolean
  notificationLead: number
  onEnableNotifications: () => void | Promise<void>
  onDisableNotifications: () => void
  onTestNotification: () => void | Promise<void>
  onLeadChange: (minutes: number) => void
  notificationError: string | null
  notificationStatus: string | null
  onExportCalendar: (weeks: number) => void
}) {
  const [weeks, setWeeks] = useState(16)
  const [feedbackType, setFeedbackType] = useState('Routine correction')
  const [feedbackClass, setFeedbackClass] = useState('')
  const [feedbackDetails, setFeedbackDetails] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const sendFeedback = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = [
      'Routine Scrapper Max feedback',
      `Section: ${section}`,
      `Type: ${feedbackType}`,
      feedbackClass ? `Class: ${feedbackClass}` : '',
      `Details: ${feedbackDetails.trim()}`,
    ].filter(Boolean).join('\n')
    setFeedbackStatus('')
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Routine Scrapper Max feedback', text })
        setFeedbackStatus('Shared. Thanks for helping improve the app!')
        setFeedbackDetails('')
        return
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
      setFeedbackStatus('Feedback copied. Paste it into your class chat and send it to the app maintainer.')
      setFeedbackDetails('')
    } catch {
      setFeedbackStatus('Could not open sharing or copy feedback on this browser.')
    }
  }

  const distinctClasses = [...new Map(classes.map((item) => [`${item.courseCode}|${item.subSection ?? ''}`, item])).values()]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <button type="button" aria-label="Close features" className="animate-backdrop absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Schedule settings and tools" className="animate-sheet panel relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">Your routine</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">Personalize, export, and send feedback</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`flex size-9 items-center justify-center rounded-full bg-black/5 text-slate-500 dark:bg-white/10 dark:text-slate-300 ${FOCUS}`}>
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-7">
          {scheduleNotice && (
            <section className="mt-3 rounded-2xl border border-[#007AFF]/20 bg-[#007AFF]/[0.06] p-3 dark:border-[#0A84FF]/20 dark:bg-[#0A84FF]/[0.08]">
              <div className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{scheduleNotice.title}</p>
                  <ul className="mt-1 grid gap-1 text-[12px] text-slate-600 dark:text-slate-300">
                    {scheduleNotice.lines.map((line, index) => <li key={`${index}-${line}`}>{line}</li>)}
                  </ul>
                  <button type="button" onClick={onDismissScheduleNotice} className={`mt-2 text-[12px] font-semibold text-[#007AFF] dark:text-[#0A84FF] ${FOCUS}`}>Got it</button>
                </div>
              </div>
            </section>
          )}

          <section className="mt-4 rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
            <h3 className="text-[14px] font-semibold">Lab group · {section}</h3>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Choose your group to highlight its labs. Other groups stay visible but dimmed.</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5" role="group" aria-label="Highlight lab group">
              {[
                { value: 'all', label: 'All groups' },
                ...labGroups.map((group) => ({ value: group, label: `Group ${group}` })),
              ].map((option) => (
                <button key={option.value} type="button" onClick={() => onLabGroupChange(option.value)} aria-pressed={labGroup === option.value}
                  className={`rounded-full px-2 py-2 text-[12px] font-semibold transition-colors ${FOCUS} ${labGroup === option.value ? 'ios-active' : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'}`}>
                  {option.label}
                </button>
              ))}
              {labGroups.length === 0 && <p className="col-span-3 text-[12px] text-slate-500">No split lab groups are listed for this section.</p>}
            </div>
          </section>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
            <div className="flex items-start gap-2.5">
              <Bell className="mt-0.5 size-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold">Class and due-date alerts</h3>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                  {notificationsEnabled
                    ? 'Class reminders are scheduled ahead; tasks notify at 9:00 AM on their due date.'
                    : 'Get a notification before class and on quiz, assignment, or presentation due dates.'}
                </p>
              </div>
            </div>
            {notificationsEnabled ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <label htmlFor="class-alert-lead" className="text-[12px] text-slate-500 dark:text-slate-400">Before class</label>
                <select id="class-alert-lead" value={notificationLead} onChange={(event) => onLeadChange(Number(event.target.value))} className={`${FIELD} max-w-36 text-center`}>
                  {[5, 10, 15, 30].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
                </select>
                <button type="button" onClick={onDisableNotifications} className={`shrink-0 text-[12px] font-semibold text-[#FF453A] ${FOCUS}`}>Turn off</button>
              </div>
            ) : (
              <button type="button" onClick={() => void onEnableNotifications()} className={`ios-active mt-3 w-full rounded-full py-2.5 text-[13px] font-semibold ${FOCUS}`}>
                Enable notifications
              </button>
            )}
            {notificationsEnabled && <button type="button" onClick={() => void onTestNotification()} className={`mt-3 w-full rounded-full border border-slate-200 py-2 text-[12px] font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300 ${FOCUS}`}>Send test alert</button>}
            {notificationStatus && <p role="status" className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">{notificationStatus}</p>}
            {notificationError && <p role="alert" className="mt-2 text-[12px] text-amber-600 dark:text-amber-400">{notificationError}</p>}
            {notificationsEnabled && !('Notification' in window) && <p className="mt-2 text-[11px] text-slate-400">This browser may not support notifications. The Android app uses scheduled device alerts.</p>}
            {notificationsEnabled && <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">On Android, alerts are scheduled on your device and can arrive with the app closed. In a browser, keep the page open for scheduled alerts.</p>}
          </section>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
              <div>
                <h3 className="text-[14px] font-semibold">Export to your calendar</h3>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Download a recurring calendar file for {section}.</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <label htmlFor="calendar-weeks" className="shrink-0 text-[12px] text-slate-500 dark:text-slate-400">Repeat for</label>
              <select id="calendar-weeks" value={weeks} onChange={(event) => setWeeks(Number(event.target.value))} className={`${FIELD} w-full min-w-0 text-center`}>
                {[4, 8, 12, 16, 20, 24].map((count) => <option key={count} value={count}>{count} weeks</option>)}
              </select>
              <button type="button" onClick={() => onExportCalendar(weeks)} disabled={classes.length === 0} className={`ios-active col-span-2 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full py-2.5 text-[13px] font-semibold disabled:opacity-40 ${FOCUS}`}>
                <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
                <span>Export calendar (.ics)</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">Events repeat weekly; holidays and one-off room changes aren’t included in the calendar file.</p>
          </section>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
            <div className="flex items-start gap-2.5">
              <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />
              <div>
                <h3 className="text-[14px] font-semibold">Report a correction or idea</h3>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Share a wrong room or time, or suggest a feature with your class chat or app maintainer.</p>
              </div>
            </div>
            <form onSubmit={sendFeedback} className="mt-3 grid gap-2.5">
              <label className="grid gap-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Feedback type</span>
                <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)} className={`${FIELD} text-center`}>
                  {['Routine correction', 'Feature idea', 'Other feedback'].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              {distinctClasses.length > 0 && (
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Related class (optional)</span>
                  <span className="relative">
                    <select value={feedbackClass} onChange={(event) => setFeedbackClass(event.target.value)} className={`${FIELD} appearance-none pr-8 text-center`}>
                      <option value="">Select a class</option>
                      {distinctClasses.map((item) => <option key={`${item.courseCode}|${item.subSection ?? ''}`} value={`${item.courseCode}${item.subSection ? ` ${item.subSection}` : ''}`}>{item.courseCode}{item.subSection ? ` · ${item.subSection}` : ''}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  </span>
                </label>
              )}
              <label className="grid gap-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Details</span>
                <textarea required value={feedbackDetails} onChange={(event) => setFeedbackDetails(event.target.value.slice(0, 500))} rows={3} maxLength={500} placeholder="What should be corrected or added?" className={`${FIELD} resize-y`} />
              </label>
              <button type="submit" className={`ios-active flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-semibold ${FOCUS}`}>
                <Share2 className="size-4" /> Share feedback
              </button>
              {feedbackStatus && <p role="status" className="text-[12px] text-slate-500 dark:text-slate-400">{feedbackStatus}</p>}
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

