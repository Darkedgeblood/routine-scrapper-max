const GITHUB_RELEASES_URL = 'https://api.github.com/repos/Darkedgeblood/routine-scrapper-max/releases/latest'

export const dynamic = 'force-dynamic'

type GitHubRelease = {
  tag_name?: string
  body?: string | null
  assets?: { name?: string; browser_download_url?: string }[]
}

export async function GET() {
  try {
    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 300 },
    })
    if (!response.ok) return Response.json({ error: 'Release check unavailable.' }, { status: 502 })

    const release = await response.json() as GitHubRelease
    const tag = release.tag_name ?? ''
    const build = Number(tag.match(/^apk-build-(\d+)$/)?.[1])
    const apkUrl = release.assets?.find((asset) => asset.name === 'Routine-Scrapper-Max.apk')?.browser_download_url
    const body = release.body ?? ''

    // Older releases used temporary debug keys, so never offer them as an update.
    if (!Number.isSafeInteger(build) || build < 1 || !apkUrl || !/^https:\/\/github\.com\/Darkedgeblood\/routine-scrapper-max\/releases\/download\//i.test(apkUrl) || !/apk signing:\s*stable/i.test(body)) {
      return Response.json({ update: null })
    }

    return Response.json({
      update: {
        build,
        tag,
        apkUrl,
        critical: /update[- ]urgency:\s*critical/i.test(body),
      },
    })
  } catch (error) {
    console.error('Could not check GitHub Releases for an APK update.', error)
    return Response.json({ error: 'Release check unavailable.' }, { status: 502 })
  }
}
