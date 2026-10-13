'use client'

// Quiz / assignment / presentation reminders.
// Stored in the signed-in account (Supabase table `reminders`), so they follow you across devices.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'

export type ReminderType = 'quiz' | 'assignment' | 'presentation'

export type Reminder = {
  id: string
  type: ReminderType
  course: string // course code, or '' for "Other"
  note: string // optional topic / details
  date: string // local calendar date, YYYY-MM-DD
  done: boolean
}

const LEGACY_KEY = 'routine-reminders' // old per-device storage, imported once into the account

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

const COLUMNS = 'id, type, course, note, date, done'

type Row = { id: string; type: ReminderType; course: string; note: string; date: string; done: boolean }

const toReminder = (r: Row): Reminder => ({
  id: r.id,
  type: r.type,
  course: r.course ?? '',
  note: r.note ?? '',
  date: String(r.date).slice(0, 10),
  done: !!r.done,
})

// Reminders saved on this device before accounts existed.
function readLegacy(): Omit<Reminder, 'id'>[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (r) =>
          r &&
          ['quiz', 'assignment', 'presentation'].includes(r.type) &&
          typeof r.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(r.date)
      )
      .map((r) => ({
        type: r.type as ReminderType,
        course: typeof r.course === 'string' ? r.course.slice(0, 20) : '',
        note: typeof r.note === 'string' ? r.note.slice(0, 80) : '',
        date: r.date as string,
        done: !!r.done,
      }))
  } catch {
    return []
  }
}

export function useReminders(userId: string | null) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [error, setError] = useState<string | null>(null)
  const activeUser = useRef<string | null>(null)
  const latest = useRef<Reminder[]>([]) // always the newest list, for use inside async handlers
  useEffect(() => {
    latest.current = reminders
  }, [reminders])

  const load = useCallback(async () => {
    if (!supabase || !userId) return
    const { data, error: loadError } = await supabase.from('reminders').select(COLUMNS).order('date', { ascending: true })
    if (activeUser.current !== userId) return // signed out / switched account meanwhile
    if (loadError) {
      setError('Could not load your reminders.')
      return
    }
    setError(null)
    setReminders((data as Row[]).map(toReminder))
  }, [userId])

  // Load on sign-in, clear on sign-out. Reminders are never kept on the device.
  useEffect(() => {
    activeUser.current = userId
    setReminders([])
    setError(null)
    if (!supabase || !userId) return
    const client = supabase

    ;(async () => {
      // One-time import of reminders made before accounts existed.
      const flag = `routine-reminders-imported:${userId}`
      try {
        if (!window.localStorage.getItem(flag)) {
          const legacy = readLegacy()
          if (legacy.length > 0) {
            const { error: importError } = await client.from('reminders').insert(legacy)
            if (importError) throw importError
            window.localStorage.removeItem(LEGACY_KEY)
          }
          window.localStorage.setItem(flag, '1')
        }
      } catch {
        // leave the old data in place and retry on the next sign-in
      }
      await load()
    })()

    // Pick up changes made on another device when you come back to the app.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userId, load])

  const add = useCallback(
    async (input: Omit<Reminder, 'id' | 'done'>) => {
      if (!supabase || !userId) return
      const { data, error: insertError } = await supabase.from('reminders').insert(input).select(COLUMNS).single()
      if (insertError || !data) {
        setError('Could not save that reminder. Please try again.')
        return
      }
      setError(null)
      setReminders((prev) => [...prev, toReminder(data as Row)])
    },
    [userId]
  )

  const toggle = useCallback(async (id: string) => {
    if (!supabase) return
    const current = latest.current.find((r) => r.id === id)
    if (!current) return
    const next = !current.done
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: next } : r)))
    const { error: updateError } = await supabase.from('reminders').update({ done: next }).eq('id', id)
    if (updateError) {
      setError('Could not update that reminder.')
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !next } : r)))
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    if (!supabase) return
    const removed = latest.current.find((r) => r.id === id)
    if (!removed) return
    setReminders((prev) => prev.filter((r) => r.id !== id))
    const { error: deleteError } = await supabase.from('reminders').delete().eq('id', id)
    if (deleteError) {
      setError('Could not delete that reminder.')
      setReminders((prev) => [...prev, removed])
    }
  }, [])

  // Everything not ticked off yet: upcoming AND overdue. This drives the red badge.
  const pending = useMemo(
    () => reminders.filter((r) => !r.done).sort((a, b) => a.date.localeCompare(b.date)),
    [reminders]
  )

  return { reminders, pending, error, add, toggle, remove }
}
