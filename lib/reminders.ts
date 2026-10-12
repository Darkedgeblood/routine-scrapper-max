'use client'

// Quiz / assignment / presentation reminders.
// Stored in this browser only (localStorage), so they are NOT synced between devices.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ReminderType = 'quiz' | 'assignment' | 'presentation'

export type Reminder = {
  id: string
  type: ReminderType
  course: string // course code, or '' for "Other"
  note: string // optional topic / details
  date: string // local calendar date, YYYY-MM-DD
  done: boolean
}

const STORAGE_KEY = 'routine-reminders'
const TYPES: ReminderType[] = ['quiz', 'assignment', 'presentation']

// Local (not UTC) calendar-date key, e.g. "2026-10-12".
export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

// Whole days from today to the given date (negative = in the past).
export function daysFromToday(key: string, today: Date) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((parseDateKey(key).getTime() - start.getTime()) / 86400000)
}

export function relativeLabel(key: string, today: Date) {
  const diff = daysFromToday(key, today)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1) return `In ${diff} days`
  if (diff === -1) return '1 day overdue'
  return `${-diff} days overdue`
}

function isValid(value: unknown): value is Reminder {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    TYPES.includes(r.type as ReminderType) &&
    typeof r.course === 'string' &&
    typeof r.note === 'string' &&
    typeof r.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    typeof r.done === 'boolean'
  )
}

function readStored(): Reminder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isValid) : []
  } catch {
    return []
  }
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const loaded = useRef(false)

  // Load once on the client, and stay in sync if another tab changes them.
  useEffect(() => {
    setReminders(readStored())
    loaded.current = true
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setReminders(readStored())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Save every change (but never before the first load, which would wipe saved data).
  useEffect(() => {
    if (!loaded.current) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
    } catch {
      // storage full or blocked: keep working in memory
    }
  }, [reminders])

  const add = useCallback((input: Omit<Reminder, 'id' | 'done'>) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setReminders((prev) => [...prev, { ...input, id, done: false }])
  }, [])

  const toggle = useCallback((id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))
  }, [])

  const remove = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // Everything not ticked off yet: upcoming AND overdue. This drives the red badge.
  const pending = useMemo(
    () => reminders.filter((r) => !r.done).sort((a, b) => a.date.localeCompare(b.date)),
    [reminders]
  )

  return { reminders, pending, add, toggle, remove }
}
