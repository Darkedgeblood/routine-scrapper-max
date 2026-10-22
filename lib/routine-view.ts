import { DAYS, TEACHERS, type RoutineItem } from './routine-data'

export type RoutineDay = (typeof DAYS)[number]

export function getToday(date = new Date()): RoutineDay | null {
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
  return DAYS.includes(day as RoutineDay) ? day as RoutineDay : null
}

/** Returns the Saturday-through-Thursday dates shown by the dashboard. */
export function getWeekDates(today: Date): Date[] {
  const start = new Date(today)
  const sinceSaturday = (start.getDay() + 1) % 7
  start.setDate(start.getDate() - (sinceSaturday === 6 ? -1 : sinceSaturday))
  return DAYS.map((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function isSkippedCourse(item: RoutineItem, skippedCourses: string[]) {
  return skippedCourses.includes(item.courseCode)
}

export function isOtherLabGroup(item: RoutineItem, group: string) {
  return !!item.subSection && group !== 'all' && item.subSection.slice(-1) !== group
}

export function isInactive(item: RoutineItem, skippedCourses: string[], skippedLabs: string[], group: string) {
  return isSkippedCourse(item, skippedCourses) ||
    (!!item.subSection && skippedLabs.includes(item.subSection)) ||
    isOtherLabGroup(item, group)
}

export function teacherLabel(initials: string) {
  return TEACHERS[initials] || initials
}

export function formatCountdown(totalMinutes: number) {
  if (totalMinutes <= 0) return 'now'
  if (totalMinutes < 60) return `${totalMinutes}m`
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
}
