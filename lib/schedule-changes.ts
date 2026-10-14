import type { RoutineItem } from '@/lib/routine-data'

const SNAPSHOT_KEY = 'routine-schedule-snapshot-v1'
const PENDING_KEY = 'routine-schedule-pending-notice-v1'
const DISMISSED_PREFIX = 'routine-schedule-notice-dismissed:'

export type ScheduleNotice = { id: string; title: string; lines: string[] }
type SnapshotItem = Pick<RoutineItem, 'section' | 'day' | 'courseCode' | 'subSection' | 'startTime' | 'endTime' | 'room' | 'teacher'>

function fingerprint(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}

function shortClass(item: SnapshotItem) {
  return `${item.courseCode} · ${item.day.slice(0, 3)}${item.subSection ? ` · ${item.subSection}` : ''}`
}

function summarizeChanges(oldItems: SnapshotItem[], nextItems: SnapshotItem[]) {
  const oldMap = new Map(oldItems.map((item) => [`${item.section}|${item.day}|${item.courseCode}|${item.subSection ?? ''}`, item]))
  const nextMap = new Map(nextItems.map((item) => [`${item.section}|${item.day}|${item.courseCode}|${item.subSection ?? ''}`, item]))
  const lines: string[] = []

  for (const [key, current] of nextMap) {
    const previous = oldMap.get(key)
    if (!previous) {
      lines.push(`Added: ${shortClass(current)} · ${current.startTime} · ${current.room}`)
      continue
    }
    if (previous.startTime !== current.startTime || previous.endTime !== current.endTime) {
      lines.push(`Time changed: ${shortClass(current)} · ${previous.startTime} → ${current.startTime}`)
    }
    if (previous.room !== current.room) {
      lines.push(`Room changed: ${shortClass(current)} · ${previous.room} → ${current.room}`)
    }
    if (previous.teacher !== current.teacher) {
      lines.push(`Teacher changed: ${shortClass(current)} · ${previous.teacher} → ${current.teacher}`)
    }
  }

  for (const [key, previous] of oldMap) {
    if (!nextMap.has(key)) lines.push(`Removed or moved: ${shortClass(previous)} · ${previous.startTime} · ${previous.room}`)
  }
  return lines
}

export function checkForScheduleChanges(items: RoutineItem[]): ScheduleNotice | null {
  try {
    const current: SnapshotItem[] = items.map(({ section, day, courseCode, subSection, startTime, endTime, room, teacher }) => ({
      section, day, courseCode, subSection: subSection ?? null, startTime, endTime, room, teacher,
    }))
    const raw = JSON.stringify(current)
    const previousRaw = localStorage.getItem(SNAPSHOT_KEY)
    let notice: ScheduleNotice | null = null

    if (!previousRaw) {
      notice = {
        id: 'all-69-sections-added',
        title: 'Routines for all sections are here',
        lines: ['Choose your section and lab group to see your classes.'],
      }
    } else if (previousRaw !== raw) {
      try {
        const previous = JSON.parse(previousRaw) as SnapshotItem[]
        const changes = summarizeChanges(Array.isArray(previous) ? previous : [], current)
        notice = {
          id: `schedule-${fingerprint(raw)}`,
          title: 'Your class routine changed',
          lines: changes.length ? changes.slice(0, 5) : ['The latest class routine is now available.'],
        }
      } catch {
        notice = { id: `schedule-${fingerprint(raw)}`, title: 'Your class routine was updated', lines: ['The latest class routine is now available.'] }
      }
    }

    localStorage.setItem(SNAPSHOT_KEY, raw)
    if (!notice) {
      try { notice = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as ScheduleNotice | null } catch { notice = null }
    } else {
      localStorage.setItem(PENDING_KEY, JSON.stringify(notice))
    }
    if (notice && localStorage.getItem(`${DISMISSED_PREFIX}${notice.id}`) === '1') {
      localStorage.removeItem(PENDING_KEY)
      return null
    }
    return notice
  } catch {
    return null
  }
}

export function dismissScheduleNotice(id: string) {
  try {
    localStorage.setItem(`${DISMISSED_PREFIX}${id}`, '1')
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as ScheduleNotice | null
    if (pending?.id === id) localStorage.removeItem(PENDING_KEY)
  } catch {
    // The notice will simply be shown again if storage is unavailable.
  }
}

