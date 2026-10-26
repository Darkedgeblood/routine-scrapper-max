import { formatApkVersion } from './app-version.ts'

export type GitHubApkRelease = {
  tag_name?: string
  body?: string | null
  draft?: boolean
  prerelease?: boolean
  assets?: { name?: string; browser_download_url?: string }[]
}

export type NotifiableApkRelease = {
  build: number
  tag: string
  apkUrl: string
  critical: boolean
}

const RELEASE_DOWNLOAD_PREFIX = 'https://github.com/Darkedgeblood/routine-scrapper-max/releases/download/'

/**
 * Offer major APK releases by default. A release explicitly marked critical
 * can still notify users between major versions for a security or native fix.
 */
export function selectNotifiableApkRelease(releases: readonly GitHubApkRelease[]): NotifiableApkRelease | null {
  for (const release of releases) {
    const tag = release.tag_name ?? ''
    const build = Number(tag.match(/^apk-build-(\d+)$/)?.[1])
    const body = release.body ?? ''
    const apkUrl = release.assets?.find((asset) => asset.name === 'Routine-Scrapper-Max.apk')?.browser_download_url
    const critical = /update[- ]urgency:\s*critical/i.test(body)
    const major = Number.isSafeInteger(build) && build > 0 && formatApkVersion(build).endsWith('.0')

    if (
      release.draft || release.prerelease ||
      !Number.isSafeInteger(build) || build < 1 ||
      !apkUrl || !apkUrl.startsWith(RELEASE_DOWNLOAD_PREFIX) ||
      !/apk signing:\s*stable/i.test(body) ||
      (!major && !critical)
    ) continue

    return { build, tag, apkUrl, critical }
  }

  return null
}
