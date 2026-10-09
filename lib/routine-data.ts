// All routine data lives here, separate from the UI, so the schedule can be
// updated (or later fetched from a sheet/API) without touching the page.

export type RoutineItem = {
  id: string
  day: string
  startTime: string
  endTime: string
  courseCode: string
  courseTitle: string
  room: string
  teacher: string
  section: string
  subSection?: string | null
  startMinutes: number
  endMinutes: number
  isRetake: boolean
}

export const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'] as const

export const FULL_DAYS: Record<string, string> = {
  Sat: 'Saturday',
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
}

export const SECTIONS = ['69_A', '69_B', '69_C', '69_D', '69_E', '69_F', '69_G', '69_H', '69_I', '69_J', '69_K', '69_L', '69_M', '69_N', '69_O', '69_P']

// Teacher initials -> full names. Fill these in and the app shows the full
// name everywhere (with the initials as a hover tooltip until you do).
export const TEACHERS: Record<string, string> = {
  SRRS: 'Sadikur Rahman Sadik',
  SRS: 'Shahariar Sarkar',
  IEA: 'Ishtiaque Ahmed',
  NRM: 'Noor Muhammad',
}

// The class routine everyone sees.
export const ROUTINE_DATA: RoutineItem[] = [
  { id: 'sun-aol101', day: 'Sunday', startTime: '08:30 AM', endTime: '10:00 AM', startMinutes: 510, endMinutes: 600, courseCode: 'AOL101', courseTitle: 'Art of Living', section: '69_P', teacher: 'IEA', room: 'KT-217', isRetake: false, subSection: null },
  { id: 'sun-cse216', day: 'Sunday', startTime: '11:30 AM', endTime: '02:30 PM', startMinutes: 690, endMinutes: 870, courseCode: 'CSE216', courseTitle: 'Electronic Devices and Circuits Lab', section: '69_P', teacher: 'SRRS', room: 'SH-105 (E.C. & B.E. Lab)', isRetake: false, subSection: '69_P1' },
  { id: 'mon-cse221', day: 'Monday', startTime: '02:30 PM', endTime: '04:00 PM', startMinutes: 870, endMinutes: 960, courseCode: 'CSE221', courseTitle: 'Object Oriented Programming', section: '69_P', teacher: 'SRS', room: 'G1-027', isRetake: false, subSection: null },
  { id: 'mon-aol101', day: 'Monday', startTime: '04:00 PM', endTime: '05:30 PM', startMinutes: 960, endMinutes: 1050, courseCode: 'AOL101', courseTitle: 'Art of Living', section: '69_P', teacher: 'IEA', room: 'KT-224', isRetake: false, subSection: null },
  { id: 'tue-cse222', day: 'Tuesday', startTime: '11:30 AM', endTime: '02:30 PM', startMinutes: 690, endMinutes: 870, courseCode: 'CSE222', courseTitle: 'Object Oriented Programming Lab', section: '69_P', teacher: 'SRS', room: 'G1-013 (COM LAB)', isRetake: false, subSection: '69_P2' },
  { id: 'tue-cse221', day: 'Tuesday', startTime: '04:00 PM', endTime: '05:30 PM', startMinutes: 960, endMinutes: 1050, courseCode: 'CSE221', courseTitle: 'Object Oriented Programming', section: '69_P', teacher: 'SRS', room: 'KT-220', isRetake: false, subSection: null },
  { id: 'wed-cse215', day: 'Wednesday', startTime: '08:30 AM', endTime: '10:00 AM', startMinutes: 510, endMinutes: 600, courseCode: 'CSE215', courseTitle: 'Electronic Devices and Circuits', section: '69_P', teacher: 'SRRS', room: 'KT-218', isRetake: false, subSection: null },
  { id: 'wed-cse222', day: 'Wednesday', startTime: '11:30 AM', endTime: '02:30 PM', startMinutes: 690, endMinutes: 870, courseCode: 'CSE222', courseTitle: 'Object Oriented Programming Lab', section: '69_P', teacher: 'SRS', room: 'G1-002 (COM LAB)', isRetake: false, subSection: '69_P1' },
  { id: 'thu-cse216', day: 'Thursday', startTime: '08:30 AM', endTime: '11:30 AM', startMinutes: 510, endMinutes: 690, courseCode: 'CSE216', courseTitle: 'Electronic Devices and Circuits Lab', section: '69_P', teacher: 'SRRS', room: 'KT-809 (E.C. & D.E. Lab)', isRetake: false, subSection: '69_P2' },
  { id: 'thu-cse215', day: 'Thursday', startTime: '11:30 AM', endTime: '01:00 PM', startMinutes: 690, endMinutes: 780, courseCode: 'CSE215', courseTitle: 'Electronic Devices and Circuits', section: '69_P', teacher: 'SRRS', room: 'KT-220', isRetake: false, subSection: null },
]

// Extra sessions that only show in personal mode (tap the logo 5 times to switch it on or off).
export const PERSONAL_DATA: RoutineItem[] = [
  { id: 'sat-retake-mat211', day: 'Saturday', startTime: '11:30 AM', endTime: '01:00 PM', startMinutes: 690, endMinutes: 780, courseCode: 'MAT211', courseTitle: 'Engineering Mathematics', section: 'RE_B(3C)', teacher: 'NRM', room: 'KT-217', isRetake: true, subSection: null },
  { id: 'sun-retake-mat211', day: 'Sunday', startTime: '08:30 AM', endTime: '10:00 AM', startMinutes: 510, endMinutes: 600, courseCode: 'MAT211', courseTitle: 'Engineering Mathematics', section: 'RE_B(3C)', teacher: 'NRM', room: 'ANX1-208', isRetake: true, subSection: null },
]

// Personal settings, applied only in personal mode.
export const MY_SKIPPED_COURSES = ['AOL101'] // courses I didn't take
export const MY_SKIPPED_LABS = ['69_P2'] // lab sub-sections I'm not in
