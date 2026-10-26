/** Converts the monotonically increasing APK build number to its user-facing version. */
export function formatApkVersion(build: number): string {
  if (!Number.isSafeInteger(build) || build < 1) {
    throw new RangeError('APK build number must be a positive safe integer.')
  }

  return `${Math.floor(build / 10)}.${build % 10}`
}
