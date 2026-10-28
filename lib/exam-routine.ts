export type MidtermExam = {
  date: string
  courseCode: string
  courseTitle: string
  startTime: string
  endTime: string
  seatAllocation: MidtermSeatAllocation | null
}

export type MidtermSeatAllocation = {
  instructorInitials: string
  rooms: readonly { room: string; seats: number }[]
  totalSeats: number
}

type MidtermExamData = Omit<MidtermExam, 'seatAllocation'> & {
  seatAllocationsBySection?: Readonly<Record<string, MidtermSeatAllocation>>
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

// Batch 69 mid-semester exams and the published CSE221 room allocation rows
// available for sections 69_I through 69_P.
const CSE221_SEAT_ALLOCATIONS_BY_SECTION: Readonly<Record<string, MidtermSeatAllocation>> = {
  '69_I': {
    instructorInitials: 'MIZ',
    rooms: [{ room: '220', seats: 21 }, { room: '221', seats: 24 }, { room: '222', seats: 6 }],
    totalSeats: 51,
  },
  '69_J': {
    instructorInitials: 'PPC',
    rooms: [{ room: '222', seats: 18 }, { room: '223', seats: 24 }, { room: '224', seats: 9 }],
    totalSeats: 51,
  },
  '69_K': {
    instructorInitials: 'MIZ',
    rooms: [{ room: '224', seats: 15 }, { room: '303', seats: 24 }, { room: '305', seats: 11 }],
    totalSeats: 50,
  },
  '69_L': {
    instructorInitials: 'PPC',
    rooms: [{ room: '305', seats: 13 }, { room: '304', seats: 24 }, { room: '306', seats: 14 }],
    totalSeats: 51,
  },
  '69_M': {
    instructorInitials: 'AAA',
    rooms: [{ room: '306', seats: 10 }, { room: '307', seats: 28 }, { room: '318A', seats: 11 }],
    totalSeats: 49,
  },
  '69_N': {
    instructorInitials: 'MIZ',
    rooms: [{ room: '318A', seats: 13 }, { room: '318B', seats: 24 }, { room: '320', seats: 13 }],
    totalSeats: 50,
  },
  '69_O': {
    instructorInitials: 'AAA',
    rooms: [{ room: '320', seats: 34 }, { room: '514', seats: 14 }],
    totalSeats: 48,
  },
  '69_P': {
    instructorInitials: 'SRS',
    rooms: [{ room: '514', seats: 10 }, { room: '515', seats: 24 }, { room: '516', seats: 13 }],
    totalSeats: 47,
  },
}

export const BATCH_69_MIDTERM_EXAMS: readonly MidtermExamData[] = [
  {
    date: '2026-10-29',
    courseCode: 'CSE221',
    courseTitle: 'Object Oriented Programming',
    startTime: '11:30 AM',
    endTime: '01:00 PM',
    seatAllocationsBySection: CSE221_SEAT_ALLOCATIONS_BY_SECTION,
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
  return BATCH_69_MIDTERM_EXAMS
    .filter((exam) => exam.date === date)
    .map(({ seatAllocationsBySection, ...exam }) => ({
      ...exam,
      seatAllocation: seatAllocationsBySection?.[section] ?? null,
    }))
}
