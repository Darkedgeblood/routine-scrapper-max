export type MidtermExam = {
  date: string
  courseCode: string
  courseTitle: string
  startTime: string
  endTime: string
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
  if (!date || !/^69_[A-P]$/.test(section)) return []
  return BATCH_69_MIDTERM_EXAMS.filter((exam) => exam.date === date)
}

export function getUpcomingBatch69MidtermExams(
  today: string | null,
  excludedDate: string | null,
  section: string
): MidtermExam[] {
  if (!/^69_[A-P]$/.test(section)) return []
  return BATCH_69_MIDTERM_EXAMS.filter(
    (exam) => (!today || exam.date >= today) && exam.date !== excludedDate
  )
}
