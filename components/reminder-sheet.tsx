'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown, ClipboardList, FileText, Presentation, Trash2, X } from 'lucide-react'

import { daysFromToday, parseDateKey, relativeLabel, toDateKey, type Reminder, type ReminderType } from '@/lib/reminders'

export type CourseOption = { code: string; title: string }

const FIELD =
  'w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:border-white/10 dark:focus-visible:ring-[#0A84FF]/60'

export const TYPE_META: Record<ReminderType, { label: string; Icon: typeof ClipboardList; tint: string }> = {
  quiz: { label: 'Quiz', Icon: ClipboardList, tint: 'bg-[#FF9F0A]/15 text-[#C77700] dark:text-[#FF9F0A]' },
  assignment: { label: 'Assignment', Icon: FileText, tint: 'bg-[#007AFF]/12 text-[#007AFF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]' },
  presentation: { label: 'Presentation', Icon: Presentation, tint: 'bg-[#AF52DE]/12 text-[#AF52DE] dark:bg-[#BF5AF2]/15 dark:text-[#BF5AF2]' },
}

const TYPE_ORDER: ReminderType[] = ['quiz', 'assignment', 'presentation']

function formatDate(key: string) {
  return parseDateKey(key).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

// One reminder row. Used in the sheet and in the "due this day" card on the schedule.
export function ReminderRow({
  reminder,
  now,
  onToggle,
  onRemove,
  showDate = true,
}: {
  reminder: Reminder
  now: Date
  onToggle: (id: string) => void | Promise<void>
  onRemove?: (id: string) => void | Promise<void>
  showDate?: boolean
}) {
  const meta = TYPE_META[reminder.type]
  const overdue = !reminder.done && daysFromToday(reminder.date, now) < 0
  const title = reminder.course || reminder.note || meta.label

  return (
    <div className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={() => onToggle(reminder.id)}
        aria-label={reminder.done ? `Mark ${title} as not done` : `Mark ${title} as done`}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 ${
          reminder.done
            ? 'border-[#30D158] bg-[#30D158] text-white'
            : overdue
            ? 'border-[#FF3B30] text-transparent hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]'
            : 'border-slate-300 text-transparent hover:text-slate-400 dark:border-slate-600'
        }`}
      >
        <Check className="size-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.tint}`}>
            <meta.Icon className="size-3" aria-hidden="true" /> {meta.label}
          </span>
          <span className={`text-[15px] font-semibold ${reminder.done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}>
            {reminder.course || reminder.note || meta.label}
          </span>
        </div>
        {reminder.course && reminder.note && (
          <p className={`mt-0.5 truncate text-[13px] ${reminder.done ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
            {reminder.note}
          </p>
        )}
        {showDate && (
          <p className={`mt-0.5 text-[12px] font-medium tabular-nums ${overdue ? 'text-[#FF3B30]' : 'text-slate-400 dark:text-slate-500'}`}>
            {formatDate(reminder.date)}
            {!reminder.done && ` · ${relativeLabel(reminder.date, now)}`}
          </p>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(reminder.id)}
          aria-label={`Delete ${title}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-black/5 hover:text-[#FF3B30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:hover:bg-white/10"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}

export function ReminderSheet({
  open,
  onClose,
  reminders,
  now,
  courses,
  onAdd,
  onToggle,
  onRemove,
  error,
}: {
  error?: string | null
  open: boolean
  onClose: () => void
  reminders: Reminder[]
  now: Date | null
  courses: CourseOption[]
  onAdd: (input: Omit<Reminder, 'id' | 'done'>) => void | Promise<void>
  onToggle: (id: string) => void | Promise<void>
  onRemove: (id: string) => void | Promise<void>
}) {
  const today = now ?? new Date()
  const [type, setType] = useState<ReminderType>('quiz')
  const [course, setCourse] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => toDateKey(today))
  const [showDone, setShowDone] = useState(false)

  // Close on Escape and lock the page behind the sheet while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const pending = reminders.filter((r) => !r.done).sort((a, b) => a.date.localeCompare(b.date))
  const overdue = pending.filter((r) => daysFromToday(r.date, today) < 0)
  const upcoming = pending.filter((r) => daysFromToday(r.date, today) >= 0)
  const done = reminders.filter((r) => r.done).sort((a, b) => b.date.localeCompare(a.date))

  const canSave = !!date && (course !== '' || note.trim() !== '')

  const save = () => {
    if (!canSave) return
    onAdd({ type, course, note: note.trim(), date })
    setNote('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="animate-backdrop absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quizzes, assignments and presentations"
        className="animate-sheet panel relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-t-3xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-[22px] font-bold tracking-tight">Reminders</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-slate-500 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="sheet-scrollbar-hidden min-h-0 overflow-y-auto overscroll-contain px-5 pb-6">
          {error && (
            <p role="alert" className="mb-3 rounded-xl bg-[#FF3B30]/10 px-3 py-2 text-[13px] font-medium text-[#D70015] dark:text-[#FF453A]">
              {error}
            </p>
          )}
          {/* Add form */}
          <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-white/10">
            <div className="grid grid-cols-3 gap-1.5 sm:flex" role="group" aria-label="Type">
              {TYPE_ORDER.map((t) => {
                const m = TYPE_META[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={type === t}
                    className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 sm:flex-1 sm:flex-row sm:gap-1.5 sm:px-2 sm:text-[13px] ${
                      type === t ? 'ios-active' : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    <m.Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">{m.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 grid gap-2.5">
              <label className="grid gap-1">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Course</span>
                <select value={course} onChange={(e) => setCourse(e.target.value)} className={FIELD}>
                  <option value="">Other</option>
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  {course ? 'Topic / details (optional)' : 'What is it?'}
                </span>
                <input
                  type="text"
                  value={note}
                  maxLength={80}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') save()
                  }}
                  placeholder={course ? 'e.g. Chapter 3, Lab report 2' : 'e.g. Physics quiz'}
                  className={FIELD}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
              </label>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="ios-active mt-3.5 w-full rounded-full py-2.5 text-[15px] font-semibold transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60"
            >
              Add {TYPE_META[type].label.toLowerCase()}
            </button>
          </div>

          {/* Overdue */}
          {overdue.length > 0 && (
            <section className="mt-5">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#FF3B30]">Overdue · tick to clear</h3>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {overdue.map((r) => (
                  <ReminderRow key={r.id} reminder={r} now={today} onToggle={onToggle} onRemove={onRemove} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          <section className="mt-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Upcoming</h3>
            {upcoming.length === 0 ? (
              <p className="py-3 text-[14px] text-slate-500 dark:text-slate-400">Nothing coming up. Add a quiz, assignment or presentation above.</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {upcoming.map((r) => (
                  <ReminderRow key={r.id} reminder={r} now={today} onToggle={onToggle} onRemove={onRemove} />
                ))}
              </div>
            )}
          </section>

          {/* Completed */}
          {done.length > 0 && (
            <section className="mt-5">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="flex w-full items-center justify-between text-[12px] font-semibold uppercase tracking-wider text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/60 dark:text-slate-500"
              >
                <span>Completed ({done.length})</span>
                <ChevronDown className={`size-4 transition-transform ${showDone ? 'rotate-180' : ''}`} />
              </button>
              {showDone && (
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {done.map((r) => (
                    <ReminderRow key={r.id} reminder={r} now={today} onToggle={onToggle} onRemove={onRemove} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

