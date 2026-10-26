export type MidtermExam = {
  date: string
  courseCode: string
  courseTitle: string
  startTime: string
  endTime: string
}

export const BATCH_69_MIDTERM_PERIOD = {
  start: '2026-10-28',
  end: '2026-11-04',
} as const

export const BATCH_69_MIDTERM_PAUSED_CLASS_DATES = [
  '2026-10-28',
  '2026-10-29',
  '2026-10-30',
  '2026-10-31',
  '2026-11-01',
  '2026-11-02',
  '2026-11-03',
  '2026-11-04',
] as const

function isBatch69Section(section: string) {
  return /^69_[A-P]$/.test(section)
}

export function isBatch69MidtermPeriod(date: string | null, section: string) {
  return !!date && isBatch69Section(section) &&
    date >= BATCH_69_MIDTERM_PERIOD.start && date <= BATCH_69_MIDTERM_PERIOD.end
}

/** Keep personal retakes, while pausing regular Batch 69 timetable classes. */
export function filterMidtermPeriodClasses<T extends { isRetake?: boolean }>(
  classes: T[],
  date: string | null,
  section: string
): T[] {
  return isBatch69MidtermPeriod(date, section) ? classes.filter((item) => item.isRetake) : classes
}

// Batch 69 mid-semester exams from the Fall 2026 CSE exam schedule.
// Seat and room details are intentionally omitted until they are published.
export const BATCH_69_MIDTERM_EXAMS: readonly MidtermExam[] = [
  {
    date: '2026-10-29',
    courseCode: 'CSE221',
    courseTitle: 'Object Oriented Programming',
    startTime: '11:30 AM',
    endTime: '01:00 PM',
  },
  {
    date: '2026-11-01',
    courseCode: 'CSE215',
    courseTitle: 'Electronic Devices and Circuits',
    startTime: '11:30 AM',
    endTime: '01:00 PM',
  },
  {
    date: '2026-11-03',
    courseCode: 'AOL101',
    courseTitle: 'Art of Living',
    startTime: '11:30 AM',
    endTime: '01:00 PM',
  },
]

export function getBatch69MidtermExams(date: string | null, section: string): MidtermExam[] {
  if (!date || !isBatch69Section(section)) return []
  return BATCH_69_MIDTERM_EXAMS.filter((exam) => exam.date === date)
}

export function getUpcomingBatch69MidtermExams(
  today: string | null,
  excludedDate: string | null,
  section: string
): MidtermExam[] {
  if (!isBatch69Section(section)) return []
  return BATCH_69_MIDTERM_EXAMS.filter(
    (exam) => (!today || exam.date >= today) && exam.date !== excludedDate
  )
}
