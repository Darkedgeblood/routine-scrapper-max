import test from 'node:test'
import assert from 'node:assert/strict'

import { formatApkVersion } from '../lib/app-version.ts'

test('formats build numbers as the published pointer version', () => {
  assert.equal(formatApkVersion(47), '4.7')
  assert.equal(formatApkVersion(48), '4.8')
  assert.equal(formatApkVersion(49), '4.9')
  assert.equal(formatApkVersion(50), '5.0')
})

test('rejects invalid build numbers', () => {
  for (const build of [0, -1, 4.7, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => formatApkVersion(build), RangeError)
  }
})
