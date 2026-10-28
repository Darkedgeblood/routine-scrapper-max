import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BATCH_69_MIDTERM_EXAMS,
  BATCH_69_MIDTERM_PERIOD,
  filterMidtermPeriodClasses,
  getBatch69MidtermExams,
  isBatch69MidtermPeriod,
} from '../lib/exam-routine.ts'

test('lists the three Batch 69 midterm exams with Slot B time', () => {
  assert.deepEqual(BATCH_69_MIDTERM_EXAMS.map(({ date, courseCode, courseTitle, startTime, endTime }) => ({
    date,
    courseCode,
    courseTitle,
    startTime,
    endTime,
  })), [
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
  ])
})

test('shows each exam to Batch 69 sections only', () => {
  assert.equal(getBatch69MidtermExams('2026-10-29', '69_A')[0]?.courseCode, 'CSE221')
  assert.equal(getBatch69MidtermExams('2026-10-29', '69_P')[0]?.courseCode, 'CSE221')
  assert.deepEqual(getBatch69MidtermExams('2026-10-29', '68_A'), [])
  assert.deepEqual(getBatch69MidtermExams('2026-10-29', '69_Z'), [])
  assert.deepEqual(getBatch69MidtermExams(null, '69_P'), [])
})

test('returns room allocations for the selected section and total seat counts', () => {
  const [sectionPExam] = getBatch69MidtermExams('2026-10-29', '69_P')
  assert.deepEqual(sectionPExam?.seatAllocation, {
    instructorInitials: 'SRS',
    rooms: [{ room: '514', seats: 10 }, { room: '515', seats: 24 }, { room: '516', seats: 13 }],
    totalSeats: 47,
  })

  for (const suffix of ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']) {
    const [exam] = getBatch69MidtermExams('2026-10-29', `69_${suffix}`)
    const allocation = exam?.seatAllocation
    assert.ok(allocation, `expected a room allocation for section 69_${suffix}`)
    assert.equal(
      allocation.rooms.reduce((sum, room) => sum + room.seats, 0),
      allocation.totalSeats,
      `room counts should add up for section 69_${suffix}`
    )
  }

  const [unavailableSectionExam] = getBatch69MidtermExams('2026-10-29', '69_A')
  assert.equal(unavailableSectionExam?.seatAllocation, null)
})

test('pauses Batch 69 regular classes inclusively from October 28 through November 4', () => {
  assert.deepEqual(BATCH_69_MIDTERM_PERIOD, { start: '2026-10-28', end: '2026-11-04' })
  assert.equal(isBatch69MidtermPeriod('2026-10-28', '69_A'), true)
  assert.equal(isBatch69MidtermPeriod('2026-11-04', '69_P'), true)
  assert.equal(isBatch69MidtermPeriod('2026-10-27', '69_P'), false)
  assert.equal(isBatch69MidtermPeriod('2026-11-05', '69_P'), false)
  assert.equal(isBatch69MidtermPeriod('2026-10-29', '68_A'), false)
})

test('hides regular class cards but preserves personal retake classes in the exam period', () => {
  const regularClass = { courseCode: 'CSE221', isRetake: false }
  const retakeClass = { courseCode: 'CSE215', isRetake: true }

  assert.deepEqual(
    filterMidtermPeriodClasses([regularClass, retakeClass], '2026-10-29', '69_P'),
    [retakeClass]
  )
  assert.deepEqual(
    filterMidtermPeriodClasses([regularClass, retakeClass], '2026-11-05', '69_P'),
    [regularClass, retakeClass]
  )
})
