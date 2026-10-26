import { selectNotifiableApkRelease, type GitHubApkRelease } from '@/lib/app-update-release'

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/Darkedgeblood/routine-scrapper-max/releases?per_page=100'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 300 },
    })
    if (!response.ok) return Response.json({ error: 'Release check unavailable.' }, { status: 502 })

    const releases = await response.json() as GitHubApkRelease[]
    return Response.json({ update: selectNotifiableApkRelease(Array.isArray(releases) ? releases : []) })
  } catch (error) {
    console.error('Could not check GitHub Releases for an APK update.', error)
    return Response.json({ error: 'Release check unavailable.' }, { status: 502 })
  }
}
