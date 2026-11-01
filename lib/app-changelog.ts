/**
 * Update the id and entries for each user-facing web release. The id is stored
 * per device so the notice appears once for each changelog revision.
 */
export const APP_CHANGELOG = {
  id: 'web-2026-11-01-midterm-class-pause',
  date: 'November 1, 2026',
  items: [
    'All Batch 69 classes, including retakes, are paused during the midterm period (Oct 28–Nov 4).',
    'The CSE221 midterm card now shows room-by-room seat counts for sections 69_A through 69_P, and CSE215 allocations are available for sections 69_I through 69_P.',
    'Quiz, assignment, and presentation dates now stand out in the day bar, and matching class cards get a yellow outline.',
    'Small APK updates no longer interrupt you; install prompts are reserved for major or critical releases.',
  ],
} as const

export const APP_CHANGELOG_STORAGE_KEY = 'routine-app-changelog-seen'

export function shouldShowAppChangelog(lastSeenId: string | null, currentId = APP_CHANGELOG.id): boolean {
  return lastSeenId !== currentId
}
