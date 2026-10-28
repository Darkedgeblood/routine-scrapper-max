/**
 * Update the id and entries for each user-facing web release. The id is stored
 * per device so the notice appears once for each changelog revision.
 */
export const APP_CHANGELOG = {
  id: 'web-2026-10-28',
  date: 'October 28, 2026',
  items: [
    'During midterms (Oct 28–Nov 4), regular classes are paused while exam cards and personal retakes remain visible.',
    'Quiz, assignment, and presentation dates now stand out in the day bar, and matching class cards get a yellow outline.',
    'Small APK updates no longer interrupt you; install prompts are reserved for major or critical releases.',
  ],
} as const

export const APP_CHANGELOG_STORAGE_KEY = 'routine-app-changelog-seen'

export function shouldShowAppChangelog(lastSeenId: string | null, currentId = APP_CHANGELOG.id): boolean {
  return lastSeenId !== currentId
}
