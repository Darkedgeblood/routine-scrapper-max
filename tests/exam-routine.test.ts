import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BATCH_69_MIDTERM_EXAMS,
  BATCH_69_MIDTERM_PERIOD,
  filterMidtermPeriodClasses,
  getBatch69MidtermExams,
  getUpcomingBatch69MidtermExams,
  isBatch69MidtermPeriod,
} from '../lib/exam-routine.ts'

test('lists the three Batch 69 midterm exams with Slot B time and no seat details', () => {
  assert.deepEqual(BATCH_69_MIDTERM_EXAMS, [
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

test('keeps future exams visible without duplicating the selected-day exam', () => {
  assert.deepEqual(
    getUpcomingBatch69MidtermExams('2026-10-26', '2026-10-29', '69_P').map((exam) => exam.courseCode),
    ['CSE215', 'AOL101']
  )
  assert.deepEqual(getUpcomingBatch69MidtermExams('2026-11-04', null, '69_P'), [])
  assert.deepEqual(getUpcomingBatch69MidtermExams('2026-10-26', null, '68_A'), [])
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
