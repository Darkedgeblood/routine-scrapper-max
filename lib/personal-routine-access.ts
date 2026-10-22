import type { RoutineItem } from './routine-data'

export const PERSONAL_ROUTINE_OWNER_EMAIL = '252-15-596@diu.edu.bd'

export type PersonalRoutineRecord = {
  routine: RoutineItem[]
  skipped_courses: string[]
  skipped_labs: string[]
}

export function isPersonalRoutineOwner(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === PERSONAL_ROUTINE_OWNER_EMAIL
}

export function readBearerToken(authorization: string | null): string | null {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1] ?? null
}

export function isPersonalRoutineRecord(value: unknown): value is PersonalRoutineRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    Array.isArray(record.routine) &&
    record.routine.every(isRoutineItem) &&
    Array.isArray(record.skipped_courses) &&
    record.skipped_courses.every((item) => typeof item === 'string') &&
    Array.isArray(record.skipped_labs) &&
    record.skipped_labs.every((item) => typeof item === 'string')
  )
}

function isRoutineItem(value: unknown): value is RoutineItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.day === 'string' &&
    typeof item.startTime === 'string' &&
    typeof item.endTime === 'string' &&
    typeof item.startMinutes === 'number' &&
    typeof item.endMinutes === 'number' &&
    typeof item.courseCode === 'string' &&
    typeof item.courseTitle === 'string' &&
    typeof item.room === 'string' &&
    typeof item.teacher === 'string' &&
    typeof item.section === 'string' &&
    typeof item.isRetake === 'boolean' &&
    (item.subSection === undefined || item.subSection === null || typeof item.subSection === 'string')
  )
}
