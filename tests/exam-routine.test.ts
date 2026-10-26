import test from 'node:test'
import assert from 'node:assert/strict'

import { BATCH_69_MIDTERM_EXAMS, getBatch69MidtermExams, getUpcomingBatch69MidtermExams } from '../lib/exam-routine.ts'

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
