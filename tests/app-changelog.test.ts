import test from 'node:test'
import assert from 'node:assert/strict'

import { APP_CHANGELOG, shouldShowAppChangelog } from '../lib/app-changelog.ts'

test('shows the changelog for first-time visitors and new revisions', () => {
  assert.equal(shouldShowAppChangelog(null), true)
  assert.equal(shouldShowAppChangelog('web-2026-10-27'), true)
})

test('does not show the same changelog again after it was dismissed', () => {
  assert.equal(shouldShowAppChangelog(APP_CHANGELOG.id), false)
})

test('each changelog entry has visible content', () => {
  assert.ok(APP_CHANGELOG.items.length > 0)
  assert.ok(APP_CHANGELOG.items.every((item) => item.trim().length > 0))
})
