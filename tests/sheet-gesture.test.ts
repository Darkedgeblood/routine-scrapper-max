import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldDismissSheetSwipe } from '../lib/sheet-gesture.ts'

test('keeps a short or upward gesture open', () => {
  assert.equal(shouldDismissSheetSwipe(80, 800, 0.3), false)
  assert.equal(shouldDismissSheetSwipe(80, 800, -0.8), false)
})

test('dismisses after a deliberate downward drag', () => {
  assert.equal(shouldDismissSheetSwipe(150, 800, 0.2), true)
})

test('dismisses after a quick downward flick', () => {
  assert.equal(shouldDismissSheetSwipe(45, 800, 0.7), true)
})

test('rejects non-finite gesture measurements', () => {
  assert.equal(shouldDismissSheetSwipe(Number.NaN, 800, 1), false)
})
