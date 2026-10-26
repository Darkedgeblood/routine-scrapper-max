import test from 'node:test'
import assert from 'node:assert/strict'

import { selectNotifiableApkRelease, type GitHubApkRelease } from '../lib/app-update-release.ts'

function release(build: number, urgency = 'normal'): GitHubApkRelease {
  return {
    tag_name: `apk-build-${build}`,
    body: `APK signing: stable\nUpdate urgency: ${urgency}`,
    assets: [{
      name: 'Routine-Scrapper-Max.apk',
      browser_download_url: `https://github.com/Darkedgeblood/routine-scrapper-max/releases/download/apk-build-${build}/Routine-Scrapper-Max.apk`,
    }],
  }
}

test('ignores minor releases and offers the newest major signed APK', () => {
  assert.deepEqual(
    selectNotifiableApkRelease([release(52), release(51), release(50)]),
    {
      build: 50,
      tag: 'apk-build-50',
      apkUrl: 'https://github.com/Darkedgeblood/routine-scrapper-max/releases/download/apk-build-50/Routine-Scrapper-Max.apk',
      critical: false,
    }
  )
  assert.equal(selectNotifiableApkRelease([release(52), release(51)]), null)
})

test('allows a critical signed release between major versions', () => {
  assert.equal(selectNotifiableApkRelease([release(53), release(52, 'critical')])?.build, 52)
  assert.equal(selectNotifiableApkRelease([release(53), release(52, 'critical')])?.critical, true)
})

test('does not offer unsigned, prerelease, draft, or unrelated APK assets', () => {
  const unsigned = release(50)
  unsigned.body = 'Update urgency: normal'
  const prerelease = { ...release(50), prerelease: true }
  const draft = { ...release(50), draft: true }
  const wrongAsset = { ...release(50), assets: [{ name: 'other.apk', browser_download_url: 'https://github.com/Darkedgeblood/routine-scrapper-max/releases/download/apk-build-50/other.apk' }] }

  assert.equal(selectNotifiableApkRelease([unsigned, prerelease, draft, wrongAsset]), null)
})
