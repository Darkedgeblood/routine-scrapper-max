import test from 'node:test'
import assert from 'node:assert/strict'

import { createRoutineCalendarText } from '../lib/calendar-export.ts'
import type { RoutineItem } from '../lib/routine-data.ts'

const wednesdayClass: RoutineItem = {
  id: 'wednesday-cse221',
  day: 'Wednesday',
  startTime: '08:30 AM',
  endTime: '10:00 AM',
  startMinutes: 510,
  endMinutes: 600,
  courseCode: 'CSE221',
  courseTitle: 'Object Oriented Programming',
  room: 'KT-517(A)',
  teacher: 'MTN',
  section: '69_P',
  subSection: null,
  isRetake: false,
}

test('excludes midterm-break dates from weekly calendar class events', () => {
  const calendar = createRoutineCalendarText(
    [wednesdayClass],
    '69_P',
    3,
    ['2026-10-28', '2026-11-04'],
    new Date(2026, 9, 26, 9, 0)
  )

  assert.match(calendar, /RRULE:FREQ=WEEKLY;COUNT=3/)
  assert.match(calendar, /EXDATE:20261028T083000/)
  assert.match(calendar, /EXDATE:20261104T083000/)
  assert.doesNotMatch(calendar, /EXDATE:20261111T083000/)
})
